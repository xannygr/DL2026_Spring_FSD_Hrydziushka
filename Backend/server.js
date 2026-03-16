const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов с одного IP
});
app.use('/api/', limiter);

// Подключение к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Подключение к Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Получение вопросов с кэшированием
app.get('/api/questions', async (req, res) => {
  try {
    const { page = 0, limit = 10, category } = req.query;
    const offset = page * limit;
    
    const cacheKey = `questions:${page}:${limit}:${category || 'all'}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    let query = 'SELECT id, question, category, difficulty, hint FROM questions';
    const params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM questions' + (category ? ' WHERE category = $1' : ''),
      category ? [category] : []
    );
    
    const response = {
      questions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      hasMore: (offset + result.rows.length) < parseInt(countResult.rows[0].count)
    };
    
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение конкретного вопроса с координатами
app.get('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM questions WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Проверка ответа
app.post('/api/check-answer', async (req, res) => {
  try {
    const { questionId, userLat, userLng, timeSpent } = req.body;
  
    const question = await pool.query(
      'SELECT * FROM questions WHERE id = $1',
      [questionId]
    );
    
    if (question.rows.length === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    
    const correctLat = parseFloat(question.rows[0].lat);
    const correctLng = parseFloat(question.rows[0].lng);
    
    const distance = calculateDistance(userLat, userLng, correctLat, correctLng);
    
    const points = calculatePoints(distance, timeSpent);
   
    await pool.query(
      'UPDATE questions SET times_used = times_used + 1, average_accuracy = (average_accuracy * times_used + $1) / (times_used + 1) WHERE id = $2',
      [Math.max(0, 100 - distance / 10), questionId]
    );
    
    res.json({
      correctLat,
      correctLng,
      distance: Math.round(distance),
      pointsEarned: points,
      maxPossiblePoints: 150,
      feedback: getFeedbackMessage(distance)
    });
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Добавление вопроса (только для авторизованных)
app.post('/api/questions', authenticateToken, async (req, res) => {
  try {
    const { question, category, difficulty, hint, lat, lng } = req.body;
    
    if (!question || !category || !difficulty || !lat || !lng) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    const result = await pool.query(
      `INSERT INTO suggested_questions 
       (question, category, difficulty, hint, lat, lng, suggested_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
       RETURNING id`,
      [question, category, difficulty, hint, lat, lng, req.user.id]
    );
    
    res.status(201).json({
      id: result.rows[0].id,
      message: 'Вопрос отправлен на модерацию'
    });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Таблица лидеров
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { period = 'alltime', limit = 10 } = req.query;
    
    let timeFilter = '';
    switch(period) {
      case 'daily':
        timeFilter = "AND played_at > NOW() - INTERVAL '1 day'";
        break;
      case 'weekly':
        timeFilter = "AND played_at > NOW() - INTERVAL '7 days'";
        break;
    }
    
    const result = await pool.query(
      `SELECT u.username, 
              SUM(gs.score) as total_score,
              COUNT(gs.id) as games_played,
              AVG(gs.average_distance) as avg_distance
       FROM game_sessions gs
       JOIN users u ON gs.user_id = u.id
       WHERE 1=1 ${timeFilter}
       GROUP BY u.id, u.username
       ORDER BY total_score DESC
       LIMIT $1`,
      [limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Сохранение результатов игры
app.post('/api/game-session', authenticateToken, async (req, res) => {
  try {
    const { score, questionsCount, averageDistance, mode } = req.body;
    
    await pool.query(
      `INSERT INTO game_sessions 
       (user_id, score, questions_count, average_distance, mode) 
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, score, questionsCount, averageDistance, mode]
    );
    
    res.status(201).json({ message: 'Результат сохранен' });
  } catch (error) {
    console.error('Error saving game session:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вспомогательные функции
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculatePoints(distance, timeSpent) {
  const basePoints = Math.max(10, 100 - Math.floor(distance / 10));
  const timeBonus = Math.max(0, 30 - timeSpent) * 2;
  return Math.min(150, basePoints + timeBonus);
}

function getFeedbackMessage(distance) {
  if (distance < 50) return '🎉 Невероятно точно!';
  if (distance < 200) return '👍 Очень близко!';
  if (distance < 500) return '👌 Хороший результат!';
  if (distance < 1000) return '👀 Неплохо, но можно точнее';
  return '💪 Попробуйте еще раз!';
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});