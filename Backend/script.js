const MockAPI = {
    /**
     База данных вопросов
     Каждый вопрос содержит:
     - id: уникальный идентификатор
     - question: текст вопроса
     - category: категория (достопримечательности, чудеса света и т.д.)
     - difficulty: сложность (easy, medium, hard)
     - hint: подсказка для игрока
     - lat: широта правильного ответа
     - lng: долгота правильного ответа
     */
    questions: [
        {
            id: 1,
            question: "Где находится Эйфелева башня?",
            category: "Достопримечательности",
            difficulty: "easy",
            hint: "Столица Франции, город на реке Сена",
            lat: 48.8584,
            lng: 2.2945
        },
        {
            id: 2,
            question: "Где находится статуя Свободы?",
            category: "Достопримечательности",
            difficulty: "easy",
            hint: "Крупнейший город США, 'Большое яблоко'",
            lat: 40.6892,
            lng: -74.0445
        },
        {
            id: 3,
            question: "Где находится Колизей?",
            category: "Достопримечательности",
            difficulty: "easy",
            hint: "Столица Италии, 'Вечный город'",
            lat: 41.8902,
            lng: 12.4922
        },
        {
            id: 4,
            question: "Где находится Тадж-Махал?",
            category: "Чудеса света",
            difficulty: "medium",
            hint: "Город Агра в Индии",
            lat: 27.1751,
            lng: 78.0421
        },
        {
            id: 5,
            question: "Где находится Сиднейский оперный театр?",
            category: "Достопримечательности",
            difficulty: "medium",
            hint: "Крупнейший город Австралии",
            lat: -33.8568,
            lng: 151.2153
        },
        {
            id: 6,
            question: "Где находится Великая Китайская стена?",
            category: "Чудеса света",
            difficulty: "medium",
            hint: "Видна из космоса, находится в Китае",
            lat: 40.4319,
            lng: 116.5704
        },
        {
            id: 7,
            question: "Где находится Мачу-Пикчу?",
            category: "Чудеса света",
            difficulty: "hard",
            hint: "Древний город инков в Перу",
            lat: -13.1631,
            lng: -72.5450
        },
        {
            id: 8,
            question: "Где находится Петра?",
            category: "Чудеса света",
            difficulty: "hard",
            hint: "Древний город в Иордании, высеченный в скалах",
            lat: 30.3285,
            lng: 35.4444
        },
        {
            id: 9,
            question: "Где находится Красная площадь?",
            category: "Достопримечательности",
            difficulty: "easy",
            hint: "Столица России",
            lat: 55.7540,
            lng: 37.6200
        },
        {
            id: 10,
            question: "Где находится Бурдж-Халифа?",
            category: "Достопримечательности",
            difficulty: "medium",
            hint: "Дубай, ОАЭ",
            lat: 25.1972,
            lng: 55.2744
        }
    ],

   
    // Таблица лидеров

    leaderboard: [
        { username: "GeoMaster", score: 1250, games: 15, accuracy: 94 },
        { username: "MapExplorer", score: 980, games: 10, accuracy: 88 },
        { username: "GlobeTrotter", score: 850, games: 8, accuracy: 85 },
        { username: "LocationHunter", score: 720, games: 7, accuracy: 82 },
        { username: "EarthWanderer", score: 650, games: 6, accuracy: 79 }
    ],

    /**
    Получение списка вопросов с пагинацией
    @param {number} page - номер страницы
    @param {number} limit - количество вопросов на странице
    @param {string} category - фильтр по категории
    @returns {Promise} - промис с данными вопросов
     */
    getQuestions: async (page = 0, limit = 10, category = null) => {
        await MockAPI.delay(300); 
        
        let filtered = [...MockAPI.questions];
        if (category) {
            filtered = filtered.filter(q => q.category === category);
        }
        
        const start = page * limit;
        const end = start + limit;
        const paginated = filtered.slice(start, end);
        
        return {
            questions: paginated.map(({ lat, lng, ...rest }) => rest), 
            total: filtered.length,
            page,
            hasMore: end < filtered.length
        };
    },

    /**
     * Получение конкретного вопроса по ID с полными координатами
     * @param {number} id - ID вопроса
     * @returns {Promise} - промис с данными вопроса
     */
    getQuestion: async (id) => {
        await MockAPI.delay(200);
        const question = MockAPI.questions.find(q => q.id === id);
        if (!question) throw new Error('Question not found');
        return { ...question };
    },

    /**
     * Проверка ответа пользователя
     * @param {number} questionId - ID вопроса
     * @param {number} userLat - широта ответа пользователя
     * @param {number} userLng - долгота ответа пользователя
     * @param {number} timeSpent - затраченное время (секунд)
     * @returns {Promise} - промис с результатом проверки
     */
    checkAnswer: async (questionId, userLat, userLng, timeSpent) => {
        await MockAPI.delay(300);
        
        const question = MockAPI.questions.find(q => q.id === questionId);
        if (!question) throw new Error('Question not found');
        
        const distance = MockAPI.calculateDistance(
            userLat, userLng,
            question.lat, question.lng
        );
        const points = MockAPI.calculatePoints(distance, timeSpent);
        
        return {
            correctLat: question.lat,
            correctLng: question.lng,
            distance: Math.round(distance),
            pointsEarned: points,
            maxPossiblePoints: 150,
            feedback: MockAPI.getFeedbackMessage(distance)
        };
    },

    /**
     * Получение таблицы лидеров
     * @param {string} period - период 
     * @returns {Promise} - промис с данными лидеров
     */
    getLeaderboard: async (period = 'alltime') => {
        await MockAPI.delay(400);
        return MockAPI.leaderboard;
    },

    /**
     * Добавление нового вопроса (предложение от пользователя)
     * @param {Object} questionData - данные нового вопроса
     * @returns {Promise} - промис с результатом добавления
     */
    addQuestion: async (questionData) => {
        await MockAPI.delay(500);
        const newId = MockAPI.questions.length + 1;
        const newQuestion = {
            id: newId,
            ...questionData,
            times_used: 0,
            average_accuracy: 0
        };
        MockAPI.questions.push(newQuestion);
        return { id: newId, message: 'Вопрос отправлен на модерацию' };
    },

    /**
     * Сохранение игровой сессии
     * @param {Object} sessionData - данные сессии
     * @returns {Promise} - промис с результатом
     */
    saveGameSession: async (sessionData) => {
        await MockAPI.delay(200);
        console.log('Game session saved:', sessionData);
        return { success: true };
    },

    /**
     * Вспомогательная функция задержки
     * @param {number} ms - миллисекунд задержки
     * @returns {Promise} - промис с таймаутом
     */
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Расчет расстояния между двумя точками на сфере (формула гаверсинуса)
     * @param {number} lat1 - широта первой точки
     * @param {number} lon1 - долгота первой точки
     * @param {number} lat2 - широта второй точки
     * @param {number} lon2 - долгота второй точки
     * @returns {number} - расстояние в километрах
     */
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    /**
     * Расчет очков на основе точности и скорости
     * @param {number} distance - расстояние в км
     * @param {number} timeSpent - затраченное время в секундах
     * @returns {number} - заработанные очки
     */
    calculatePoints: (distance, timeSpent) => {

        const basePoints = Math.max(10, 100 - Math.floor(distance / 10));
        
        const timeBonus = Math.max(0, 30 - timeSpent) * 2;
        
        return Math.min(150, basePoints + timeBonus);
    },

    /**
     * Получение текстового сообщения на основе расстояния
     * @param {number} distance - расстояние в км
     * @returns {string} - сообщение обратной связи
     */
    getFeedbackMessage: (distance) => {
        if (distance < 50) return '🎉 Невероятно точно! + бонус за скорость';
        if (distance < 200) return '👍 Очень близко! Хороший результат';
        if (distance < 500) return '👌 Хороший результат, можно лучше';
        if (distance < 1000) return '👀 Неплохо, но изучите карту внимательнее';
        return '💪 В следующий раз получится точнее!';
    }
};


// Состояние игры

const GameState = {
    currentQuestionIndex: 0,     // Индекс текущего вопроса
    totalScore: 0,               // Общий счет игрока
    canClick: true,              // Можно ли кликать по карте
    userMarker: null,            // Маркер пользователя на карте
    correctMarker: null,         // Маркер правильного ответа
    timerInterval: null,         // Интервал таймера
    timeLeft: 30,                // Оставшееся время
    questions: [],               // Список вопросов
    currentQuestion: null,       // Текущий вопрос с координатами
    gameMode: 'series',          // Режим игры
    maxQuestions: 10,            // Максимальное количество вопросов
    map: null,                   // Объект карты Leaflet
    lineLayer: null,
    distanceMarker: null,              


    // Сброс состояния игры
    reset: function() {
        this.currentQuestionIndex = 0;
        this.totalScore = 0;
        this.canClick = true;
        this.timeLeft = 30;
        this.userMarker = null;
        this.correctMarker = null;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        document.getElementById('score').textContent = '0';
    },

    
    // Очистка маркеров с карты
clearMarkers: function() {
    if (this.userMarker) {
        this.map.removeLayer(this.userMarker);
        this.userMarker = null;
    }
    if (this.correctMarker) {
        this.map.removeLayer(this.correctMarker);
        this.correctMarker = null;
    }
    if (this.lineLayer) {
        this.map.removeLayer(this.lineLayer);
        this.lineLayer = null;
    }
    if (this.distanceMarker) {
        this.map.removeLayer(this.distanceMarker);
        this.distanceMarker = null;
    }
}
};

// Создание и настройка карты Leaflet

function initMap() {

    GameState.map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(GameState.map);
    
    return GameState.map;
}


/**
 * Загрузка вопроса по индексу
 * @param {number} index - индекс вопроса
 */
async function loadQuestion(index) {
    try {
        
        document.getElementById('question').textContent = 'Загрузка...';
        
        
        if (GameState.questions.length === 0) {
            const response = await MockAPI.getQuestions(0, 100);
            GameState.questions = response.questions;
        }
        
        const questionId = GameState.questions[index % GameState.questions.length].id;
        GameState.currentQuestion = await MockAPI.getQuestion(questionId);
        
        updateUIForNewQuestion();
        
        GameState.canClick = true;
        document.getElementById('nextBtn').disabled = true;
        document.getElementById('resultOverlay').style.display = 'none';
        
        document.getElementById('distanceInfo').textContent = '';
        document.getElementById('earnedPoints').textContent = '';
        document.getElementById('feedbackText').textContent = '';
        
        GameState.clearMarkers();
        
        resetTimer();
        startTimer();
        
        GameState.map.once('click', onMapClick);
        
    } catch (error) {
        showToast('Ошибка загрузки вопроса', 'error');
        console.error('Error loading question:', error);
    }
}

// Обновление интерфейса для нового вопроса

function updateUIForNewQuestion() {
    document.getElementById('question').textContent = GameState.currentQuestion.question;
    document.getElementById('category').textContent = GameState.currentQuestion.category;
    document.getElementById('hintText').textContent = GameState.currentQuestion.hint;
    document.getElementById('hintBox').classList.remove('active');
    
    document.getElementById('questionCounter').textContent = 
        `${GameState.currentQuestionIndex + 1}/${GameState.maxQuestions}`;
    
    const progressPercent = ((GameState.currentQuestionIndex + 1) / GameState.maxQuestions) * 100;
    document.getElementById('progress').style.width = `${progressPercent}%`;
    document.getElementById('progressPercent').textContent = `${Math.round(progressPercent)}%`;
}

/**
 * Обработка клика по карте
 * @param {Object} e - событие клика Leaflet
 */
async function onMapClick(e) {

    if (!GameState.canClick || !GameState.currentQuestion) return;
    
    GameState.canClick = false;
    clearInterval(GameState.timerInterval);
    
    const timeSpent = 30 - GameState.timeLeft;
    
    try {
        showToast('Проверка ответа...', 'info');
        
        const result = await MockAPI.checkAnswer(
            GameState.currentQuestion.id,
            e.latlng.lat,
            e.latlng.lng,
            timeSpent
        );
        
        GameState.totalScore += result.pointsEarned;
        document.getElementById('score').textContent = GameState.totalScore;
        
        addMarkersToMap(e.latlng, result);
        
        showResultOverlay(result);
        
        document.getElementById('nextBtn').disabled = false;
        
        if (GameState.currentQuestionIndex === GameState.maxQuestions - 1) {
            await MockAPI.saveGameSession({
                score: GameState.totalScore,
                questionsCount: GameState.maxQuestions,
                averageDistance: result.distance,
                mode: GameState.gameMode
            });
            
            showToast('Игра окончена! Хотите сыграть еще?', 'success');
        }
        
    } catch (error) {
        showToast('Ошибка проверки ответа', 'error');
        console.error('Error checking answer:', error);
        GameState.canClick = true; 
    }
}

/**
 * Добавление маркеров на карту
 * @param {Object} userLatLng - координаты клика пользователя
 * @param {Object} result - результат проверки
 */
function addMarkersToMap(userLatLng, result) {
    
    GameState.userMarker = L.marker([userLatLng.lat, userLatLng.lng], {
        icon: L.divIcon({
            className: 'user-marker',
            html: '📍',
            iconSize: [30, 30],
            popupAnchor: [0, -15]
        })
    }).addTo(GameState.map).bindPopup('Ваш ответ');
    
    GameState.correctMarker = L.marker([result.correctLat, result.correctLng], {
        icon: L.divIcon({
            className: 'correct-marker',
            html: '🎯',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        })
    }).addTo(GameState.map).bindPopup('Правильный ответ');
    
    GameState.lineLayer = L.polyline([
        [userLatLng.lat, userLatLng.lng],
        [result.correctLat, result.correctLng]
    ], { 
        color: '#ff4444', 
        weight: 3, 
        opacity: 0.6, 
        dashArray: '5, 10',
        lineCap: 'round'

    }).addTo(GameState.map);
    
    // Точка с расстоянием
    const midPoint = [
        (userLatLng.lat + result.correctLat) / 2,
        (userLatLng.lng + result.correctLng) / 2
    ];
    
    GameState.distanceMarker = L.marker(midPoint, {
        icon: L.divIcon({
            className: 'distance-label',
            html: `${result.distance} км`,
            iconSize: [60, 20]
        })
    }).addTo(GameState.map);
}

/**
 * Отображение результатов в оверлее
 * @param {Object} result - результат проверки
 */
function showResultOverlay(result) {
    document.getElementById('earnedPoints').textContent = `+${result.pointsEarned}`;
    document.getElementById('distanceInfo').textContent = `Расстояние: ${result.distance} км`;
    document.getElementById('feedbackText').textContent = result.feedback;
    document.getElementById('resultOverlay').style.display = 'block';
    
    document.getElementById('resultOverlay').style.animation = 'none';
    document.getElementById('resultOverlay').offsetHeight;
    document.getElementById('resultOverlay').style.animation = 'slideInRight 0.3s ease';
}

// Таймер

function startTimer() {
    GameState.timeLeft = 30;
    updateTimerDisplay();
    
    GameState.timerInterval = setInterval(() => {
        GameState.timeLeft--;
        updateTimerDisplay();
        
        if (GameState.timeLeft <= 0) {
            clearInterval(GameState.timerInterval);
            if (GameState.canClick && GameState.currentQuestion) {
               
                GameState.map.fire('click', {
                    latlng: L.latLng(
                        GameState.currentQuestion.lat,
                        GameState.currentQuestion.lng
                    )
                });
            }
        }
    }, 1000);
}

//Обновление отображения таймера

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    const timerStat = document.getElementById('timer');
    
    timerDisplay.textContent = GameState.timeLeft;
    timerStat.textContent = GameState.timeLeft;
    
    if (GameState.timeLeft <= 10) {
        timerDisplay.classList.add('warning');
    } else {
        timerDisplay.classList.remove('warning');
    }
}

// Сброс таймера
function resetTimer() {
    if (GameState.timerInterval) {
        clearInterval(GameState.timerInterval);
    }
    GameState.timeLeft = 30;
    updateTimerDisplay();
}


// Управление игрой
// Переход к следующему вопросу
async function nextQuestion() {
  
    if (GameState.currentQuestionIndex >= GameState.maxQuestions - 1) {
      
        showToast(`Игра окончена! Ваш счет: ${GameState.totalScore}`, 'success');
        
        if (confirm(`Игра завершена! Ваш итоговый счет: ${GameState.totalScore}\nХотите сыграть еще раз?`)) {
            GameState.currentQuestionIndex = 0;
            GameState.totalScore = 0;
            document.getElementById('score').textContent = '0';
            await loadQuestion(0);
        }
    } else {
        GameState.currentQuestionIndex++;
        await loadQuestion(GameState.currentQuestionIndex);
    }
}


function toggleHint() {
    document.getElementById('hintBox').classList.toggle('active');
}

// Таблица лидеров

async function refreshLeaderboard() {
    try {
        const leaders = await MockAPI.getLeaderboard();
        const table = document.getElementById('leaderboardTable');
        
        if (leaders.length === 0) {
            table.innerHTML = '<tr><td colspan="3" style="text-align: center;">Пока нет данных</td></tr>';
            return;
        }
        
        let html = '';
        leaders.forEach((leader, index) => {
    
            let rankIcon = '';
            if (index === 0) rankIcon = '🥇';
            else if (index === 1) rankIcon = '🥈';
            else if (index === 2) rankIcon = '🥉';
            else rankIcon = `#${index + 1}`;
            
            html += `
                <tr>
                    <td class="rank">${rankIcon}</td>
                    <td>
                        <strong>${leader.username}</strong>
                        <br>
                        <small>${leader.games} игр • ${leader.accuracy}% точн.</small>
                    </td>
                    <td style="text-align: right; font-weight: bold; color: #667eea;">${leader.score}</td>
                </tr>
            `;
        });
        
        table.innerHTML = html;
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboardTable').innerHTML = 
            '<tr><td colspan="3" style="text-align: center; color: red;">Ошибка загрузки</td></tr>';
    }
}

// Модальное окно

function showAddQuestionModal() {
    document.getElementById('addQuestionModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    document.getElementById('addQuestionModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

/**
 * Отправка нового вопроса
 * @param {Event} event - событие отправки формы
 */
async function submitQuestion(event) {
    event.preventDefault();
    
    const questionData = {
        question: document.getElementById('newQuestion').value,
        category: document.getElementById('newCategory').value,
        difficulty: document.getElementById('newDifficulty').value,
        hint: document.getElementById('newHint').value,
        lat: parseFloat(document.getElementById('newLat').value),
        lng: parseFloat(document.getElementById('newLng').value)
    };
    
    if (questionData.lat < -90 || questionData.lat > 90) {
        showToast('Широта должна быть от -90 до 90', 'error');
        return;
    }
    if (questionData.lng < -180 || questionData.lng > 180) {
        showToast('Долгота должна быть от -180 до 180', 'error');
        return;
    }
    
    try {
        showToast('Отправка вопроса...', 'info');
        
        const result = await MockAPI.addQuestion(questionData);
        
        showToast('Вопрос отправлен на модерацию! Спасибо за вклад!', 'success');
        hideModal();
        event.target.reset();
       
        await refreshLeaderboard();
        
    } catch (error) {
        showToast('Ошибка при отправке вопроса', 'error');
        console.error('Error submitting question:', error);
    }
}

// Уведомления

/**
 * Показать всплывающее уведомление
 * @param {string} message - текст уведомления
 * @param {string} type - тип (success, error, info)
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('i');
    
    switch(type) {
        case 'success':
            toastIcon.className = 'fas fa-check-circle';
            toastIcon.style.color = '#00b09b';
            break;
        case 'error':
            toastIcon.className = 'fas fa-exclamation-circle';
            toastIcon.style.color = '#ff6b6b';
            break;
        case 'info':
            toastIcon.className = 'fas fa-info-circle';
            toastIcon.style.color = '#667eea';
            break;
    }
    
    toastMessage.textContent = message;
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Инициализация при загрузке

window.onload = async () => {
    try {
        console.log('GeoQuiz инициализация...');
        
        initMap();
        
        await loadQuestion(0);
        
        await refreshLeaderboard();
        
        document.getElementById('addQuestionModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('addQuestionModal')) {
                hideModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideModal();
            }
        });
        
        console.log('GeoQuiz готов к работе!');
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showToast('Ошибка при запуске приложения', 'error');
    }
};

// Экспорт функции в глобальную область для доступа из HTML
window.nextQuestion = nextQuestion;
window.toggleHint = toggleHint;
window.showAddQuestionModal = showAddQuestionModal;
window.hideModal = hideModal;
window.submitQuestion = submitQuestion;
window.refreshLeaderboard = refreshLeaderboard;