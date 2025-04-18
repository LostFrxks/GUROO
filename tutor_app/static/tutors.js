// Футер шарики
document.addEventListener('DOMContentLoaded', () => {
    const footerAnimation = document.getElementById('footer-animation');
    const maxCircles = 50; // Максимальное количество маленьких кругов
    let bigCircle = null; // Один большой круг

    function createCircle() {
        if (document.querySelectorAll('.circle').length >= maxCircles) return;

        const circle = document.createElement('div');
        const size = Math.random() * 80 + 20; // Размер от 20 до 100px
        const speed = Math.random() * 15 + 10; // Скорость (от 10 до 25 секунд)
        const directionX = Math.random() < 0.5 ? -1 : 1; // Движение влево/вправо
        const directionY = Math.random() < 0.5 ? -1 : 1; // Движение вверх/вниз

        let startX, startY, moveX, moveY;
        const side = Math.floor(Math.random() * 4);

        switch (side) {
            case 0:
                startX = Math.random() * 100;
                startY = -10;
                moveX = directionX * (Math.random() * 50);
                moveY = 120;
                break;
            case 1:
                startX = Math.random() * 100;
                startY = 110;
                moveX = directionX * (Math.random() * 50);
                moveY = -120;
                break;
            case 2:
                startX = -10;
                startY = Math.random() * 100;
                moveX = 120;
                moveY = directionY * (Math.random() * 50);
                break;
            case 3:
                startX = 110;
                startY = Math.random() * 100;
                moveX = -120;
                moveY = directionY * (Math.random() * 50);
                break;
        }
        circle.classList.add('circle');
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.left = `${startX}vw`;
        circle.style.top = `${startY}vh`;
        circle.style.setProperty('--move-x', `${moveX}vw`);
        circle.style.setProperty('--move-y', `${moveY}vh`);
        circle.style.animation = `moveCircle ${speed}s linear infinite alternate`;

        footerAnimation.appendChild(circle);

        setTimeout(() => {
            circle.remove();
        }, speed * 1000);
    }

    function createBigCircle() {
        if (bigCircle) bigCircle.remove();

        bigCircle = document.createElement('div');
        bigCircle.classList.add('big-circle');

        const size = Math.random() * 200 + 200;
        bigCircle.style.width = `${size}px`;
        bigCircle.style.height = `${size}px`;

        let startX, startY, moveX, moveY;
        const side = Math.floor(Math.random() * 4);

        switch (side) {
            case 0:
                startX = Math.random() * 100;
                startY = -20;
                moveX = (Math.random() - 0.5) * 50;
                moveY = 130;
                break;
            case 1:
                startX = Math.random() * 100;
                startY = 120;
                moveX = (Math.random() - 0.5) * 50;
                moveY = -130;
                break;
            case 2:
                startX = -20;
                startY = Math.random() * 100;
                moveX = 130;
                moveY = (Math.random() - 0.5) * 50;
                break;
            case 3:
                startX = 120;
                startY = Math.random() * 100;
                moveX = -130;
                moveY = (Math.random() - 0.5) * 50;
                break;
        }

        bigCircle.style.left = `${startX}vw`;
        bigCircle.style.top = `${startY}vh`;
        bigCircle.style.animation = `moveBigCircle 25s linear infinite alternate`;

        footerAnimation.appendChild(bigCircle);

        setTimeout(createBigCircle, 25000);
    }

    createBigCircle();
    setInterval(createCircle, 400);
});

// document.addEventListener("DOMContentLoaded", function () {
//     console.log("✅ Проверяем авторизацию...");

//     let userIdElement = document.querySelector("#user-id");
//     let userId = userIdElement ? userIdElement.textContent.trim() : null;
//     console.log("🔍 Проверка userId:", userId);

//     if (!userId || isNaN(userId)) {
//         console.error("❌ Ошибка: Некорректный userId!", userId);
//         return;
//     }

//     function getCSRFToken() {
//         return document.cookie.split("; ")
//             .find(row => row.startsWith("csrftoken="))
//             ?.split("=")[1];
//     }

//     function loadTutors() {
//         fetch(`/api/get_tutors/?user_id=${userId}`)
//             .then(response => response.json())
//             .then(tutors => {
//                 const container = document.querySelector(".blocks");
//                 container.innerHTML = "";

//                 tutors.forEach(tutor => {
//                     const block = document.createElement("div");
//                     block.classList.add("block");

//                     let scheduleContent = "";
//                     if (tutor.schedule && Object.keys(tutor.schedule).length > 0) {
//                         // ✅ Правильный порядок дней недели
//                         const daysOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

//                         const lessonTimes = {
//                             "1": "8:00 - 9:20",
//                             "2": "9:30 - 10:50",
//                             "3": "11:40 - 13:00",
//                             "4": "13:10 - 14:30",
//                             "5": "14:40 - 16:00",
//                             "6": "16:10 - 17:30",
//                             "7": "17:40 - 19:00"
//                         };

//                         let scheduleArray = [];
//                         Object.entries(tutor.schedule).forEach(([day, times]) => {
//                             if (!Array.isArray(times)) {
//                                 times = [times];
//                             }
//                             times.forEach(time => {
//                                 scheduleArray.push({ 
//                                     day, 
//                                     time: parseInt(time), 
//                                     timeFormatted: lessonTimes[time] || `Неизвестное время (${time})` // Добавляем форматированное время
//                                 });
//                             });
//                         });

//                         // ✅ Сортируем сначала по дням недели, потом по времени
//                         scheduleArray.sort((a, b) => {
//                             let dayA = daysOrder.indexOf(a.day);
//                             let dayB = daysOrder.indexOf(b.day);
//                             if (dayA === dayB) {
//                                 return a.time - b.time; // Если дни одинаковые — сортируем по времени
//                             }
//                             return dayA - dayB; // Иначе сортируем по дням недели
//                         });

//                         // ✅ Генерируем строки с расписанием
//                         scheduleContent = scheduleArray.map(entry => 
//                             `<li>${entry.day}: ${entry.timeFormatted}</li>`
//                         ).join("");
//                     } else {
//                         scheduleContent = "<li>Нет доступных слотов</li>";
//                     }


//                     let actionContent = "";
//                     if (tutor.is_registered) {
//                         if (tutor.attended) {
//                             actionContent = `<p class="attended-text">✅ Вы уже отметились</p>`;
//                         } else {
//                             actionContent = `<button class="btn-attendance" data-id="${tutor.id}">Я присутствую</button>`;
//                         }
//                     } else if (tutor.is_pending) {
//                         actionContent = `<p class="pending-text">⏳ Ожидает подтверждения</p>`;
//                     } else {
//                         actionContent = `<button class="btn-view" data-id="${tutor.id}">Ознакомиться</button>`;
//                     }
                    
//                     block.innerHTML = `
//                         <div class="profile_photo">
//                             <img src="/media/${tutor.photo.replace('/media/', '')}" alt="Фото тьютора">
//                         </div>
//                         <div class="content">
//                             <h3>${tutor.name}</h3>
//                             <span class="grade">${tutor.subject}</span>
//                             <p><strong>📅 Расписание:</strong></p>
//                             <ul>${scheduleContent}</ul>
//                             <div class="action">${actionContent}</div>
//                         </div>
//                     `;
//                     container.appendChild(block);
//                 });
//                 document.querySelectorAll("span.grade").forEach(gradeElement => {
//                     gradeElement.innerHTML = gradeElement.innerHTML
//                         .replace(/\s*\(/, "<br>(")
//                         .replace(/\s+/g, " ")
//                         .trim();
//                 });
//             })
//             .catch(error => console.error("❌ Ошибка загрузки тьюторов:", error));
//     }

//     document.addEventListener("click", function (event) {
//         if (event.target.classList.contains("btn-register")) {
//             let tutorId = event.target.getAttribute("data-id");
//             console.log("📩 Отправляем запрос на запись к тьютору...", { tutorId, userId });

//             fetch(`/api/register_tutor/${tutorId}/${userId}/`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "X-CSRFToken": getCSRFToken()
//                 }
//             })
//                 .then(response => response.json())
//                 .then(data => {
//                     console.log("✅ Ответ от сервера:", data);
//                     if (data.success) {
//                         event.target.parentElement.innerHTML = `<p class="pending-text">⏳ Ожидает подтверждения</p>`;
//                     }
//                 })
//                 .catch(error => console.error("❌ Ошибка записи:", error));
//         }

//         if (event.target.classList.contains("btn-attendance")) {
//             let tutorId = event.target.getAttribute("data-id");
//             console.log("📌 Отмечаем присутствие", { tutorId, userId });

//             fetch(`/api/mark_attendance/${tutorId}/`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "X-CSRFToken": getCSRFToken()
//                 }
//             })
//                 .then(response => response.json())
//                 .then(data => {
//                     if (data.success) {
//                         event.target.parentElement.innerHTML = `<p class="attended-text">✅ Вы уже отметились</p>`;
//                     }
//                 })
//                 .catch(error => console.error("❌ Ошибка посещения:", error));
//         }
//     });
    
//     loadTutors();
//     console.log("✅ Готово!");
// });
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector(".main1-search-input");
    let timeout = null;

    searchInput.addEventListener("input", function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const searchText = searchInput.value.toLowerCase().trim();
            const tutorBlocks = document.querySelectorAll(".block");

            tutorBlocks.forEach(block => {
                const tutorName = block.querySelector("h3").textContent.toLowerCase().trim();
                if (tutorName.includes(searchText)) {
                    if (block.style.display === "none") {
                        block.style.display = "flex"; // Показываем блоки
                    }
                    block.classList.remove("fade-out");
                    block.classList.add("fade-in");
                } else {
                    block.classList.remove("fade-in");
                    block.classList.add("fade-out");
                    setTimeout(() => {
                        if (!tutorName.includes(searchText)) {
                            block.style.display = "none"; // Скроем только после анимации
                        }
                    }, 400);
                }
            });
        }, 100);
    });
});


const requestedTutors = new Set();

document.addEventListener("DOMContentLoaded", function () {

    console.log("✅ Проверяем авторизацию...");

    let userIdElement = document.querySelector("#user-id");
    let userId = userIdElement ? userIdElement.textContent.trim() : null;
    console.log("🔍 Проверка userId:", userId);

    if (!userId || isNaN(userId)) {
        // Показываем popup
        document.getElementById("login-required-popup").classList.add("visible");
        document.getElementById("login-required-overlay").classList.add("visible");
        document.body.style.overflow = "hidden";
        return;
    }
    function getCSRFToken() {
        return document.cookie.split("; ")
            .find(row => row.startsWith("csrftoken="))
            ?.split("=")[1];
    }
    
    // Загружаем тьюторов
    function loadTutors() {
        fetch(`/get_tutors/?user_id=${userId}`)
            .then(response => response.json())
            .then(tutors => {
                const container = document.querySelector(".blocks");
                container.innerHTML = "";  // Очищаем контейнер перед добавлением новых тьюторов

                tutors.forEach((tutor, index) => {
                    const block = document.createElement("div");
                    block.classList.add("block");
                    block.setAttribute("data-course", tutor.course || "Не указан");
                    block.setAttribute("data-subject", tutor.subject || "Не указан");

                    console.log(`Создаём блок для тьютора: ${tutor.name} | Курс: ${tutor.course} | Предмет: ${tutor.subject}`);

                    let scheduleContent = "";
                    if (tutor.schedule && Object.keys(tutor.schedule).length > 0) {
                        const daysOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
                        const lessonTimes = {
                            "1": "8:00 - 9:20",
                            "2": "9:30 - 10:50",
                            "3": "11:40 - 13:00",
                            "4": "13:10 - 14:30",
                            "5": "14:40 - 16:00",
                            "6": "16:10 - 17:30",
                            "7": "17:40 - 19:00"
                        };

                        let scheduleArray = [];
                        Object.entries(tutor.schedule).forEach(([day, times]) => {
                            if (!Array.isArray(times)) {
                                times = [times];
                            }
                            times.forEach(time => {
                                scheduleArray.push({
                                    day,
                                    time: parseInt(time),
                                    timeFormatted: lessonTimes[time] || `Неизвестное время (${time})`
                                });
                            });
                        });

                        scheduleArray.sort((a, b) => {
                            let dayA = daysOrder.indexOf(a.day);
                            let dayB = daysOrder.indexOf(b.day);
                            return dayA === dayB ? a.time - b.time : dayA - dayB;
                        });

                        scheduleContent = scheduleArray.map(entry =>
                            `<li>${entry.day}: ${entry.timeFormatted}</li>`
                        ).join("");
                    } else {
                        scheduleContent = "<li>Нет доступных слотов</li>";
                    }

                    const gradientClass = index % 2 === 0 ? 'gradient-normal' : 'gradient-reverse';
                    let actionContent = "";
                    actionContent = `<button class="btn-view" data-id="${tutor.id}">Ознакомиться</button>`;
                    // <div class="profile_photo">
                    //     <img src="/media/${tutor.photo.replace('/media/', '')}" alt="Фото тьютора">
                    // </div>
                    block.innerHTML = `
                        <div class="gradient-header ${gradientClass}">
                            <img src="/media/${tutor.photo.replace('/media/', '')}" alt="Фото тьютора">
                        </div>
                        <div class="content">
                            <h3>${tutor.name}</h3>
                            <span class="grade">${tutor.subject}</span>
                            <p><strong>📅 Расписание:</strong></p>
                            <ul>${scheduleContent}</ul>
                            <div class="action">${actionContent}</div>
                        </div>
                    `;
                    container.appendChild(block);

                    block.querySelector(".btn-view")?.addEventListener("click", function () {
                        openTutorPopup(tutor);
                    });
                });
                document.querySelectorAll("span.grade").forEach(gradeElement => {
                    gradeElement.innerHTML = gradeElement.innerHTML
                        .replace(/\s*\(/, "<br>(")
                        .replace(/\s+/g, " ")
                        .trim();
                });
            })
            .catch(error => console.error("❌ Ошибка загрузки тьюторов:", error));
    }

    function openTutorPopup(tutor) {
        const stored = JSON.parse(localStorage.getItem("requestedTutors")) || {};
        const requestTime = stored[tutor.id];
        const isRecentlyRequested = requestTime && (Date.now() - requestTime < 60 * 60 * 1000);

        const popup = document.getElementById("tutor-popup");
        const overlay = document.getElementById("tutor-popup-overlay");
    
        document.getElementById("popup1-photo").src = `/media/${tutor.photo.replace('/media/', '')}`;
        document.getElementById("popup1-name").textContent = tutor.name;
        document.getElementById("popup1-course").textContent = tutor.own_course || "сигма";
        document.getElementById("popup1-group").textContent = (tutor.group && tutor.group.trim()) ? tutor.group : "Не указано";
        document.getElementById("popup1-phone").textContent = tutor.phone || "—";
        document.getElementById("popup1-telegram-link").href = tutor.telegram || "#";
        document.getElementById("popup1-bio-text").textContent = tutor.bio || "Информация отсутствует";
        document.getElementById("popup1-course-work").textContent = tutor.course || "Информация отсутствует";
        document.getElementById("popup1-subject").textContent = tutor.subject || "Информация отсутствует";
        console.log("📦 Группа тьютора:", tutor.group);
        const scheduleEl = document.getElementById("popup1-schedule");
        scheduleEl.innerHTML = "";
        const registerBtn = document.getElementById("popup1-register");
        registerBtn.setAttribute("data-tutor-id", tutor.id);

        const requestedTutors = JSON.parse(localStorage.getItem("requestedTutors")) || [];

        if (parseInt(userId) === tutor.user_id) {
            registerBtn.textContent = "❌ Это вы";
            registerBtn.disabled = true;
            registerBtn.classList.add("disabled");
            registerBtn.style.cursor = "not-allowed";
        }
        else if (tutor.request_status === "pending" || isRecentlyRequested) {
            registerBtn.textContent = "⏳ Запрос отправлен...";
            registerBtn.disabled = true;
            registerBtn.classList.add("disabled");
            registerBtn.style.cursor = "not-allowed";
        }
        else if (tutor.request_status === "confirmed") {
            registerBtn.textContent = "✅ Вы уже записаны";
            registerBtn.disabled = true;
            registerBtn.classList.add("disabled");
            registerBtn.style.cursor = "not-allowed";
        }
        else {
            registerBtn.textContent = "Записаться";
            registerBtn.disabled = false;
            registerBtn.classList.remove("disabled");
            registerBtn.style.cursor = "pointer";
        }


        if (tutor.schedule && Object.keys(tutor.schedule).length > 0) {
            const daysOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
            const lessonTimes = {
                "1": "8:00 - 9:20", "2": "9:30 - 10:50", "3": "11:40 - 13:00",
                "4": "13:10 - 14:30", "5": "14:40 - 16:00", "6": "16:10 - 17:30",
                "7": "17:40 - 19:00"
            };
    
            let scheduleArray = [];
            Object.entries(tutor.schedule).forEach(([day, times]) => {
                (Array.isArray(times) ? times : [times]).forEach(time => {
                    scheduleArray.push({
                        day,
                        time: parseInt(time),
                        timeFormatted: lessonTimes[time] || time
                    });
                });
            });
    
            scheduleArray.sort((a, b) => {
                const dayA = daysOrder.indexOf(a.day);
                const dayB = daysOrder.indexOf(b.day);
                return dayA === dayB ? a.time - b.time : dayA - dayB;
            });
    
            scheduleArray.forEach(entry => {
                const li = document.createElement("li");
                li.textContent = `${entry.day}: ${entry.timeFormatted}`;
                scheduleEl.appendChild(li);
            });
        } else {
            scheduleEl.innerHTML = "<li>Нет доступных слотов</li>";
        }
    
        popup.classList.remove("hidden");
        overlay.classList.remove("hidden");
        popup.classList.add("visible");
        overlay.classList.add("visible");
        document.body.style.overflow = "hidden";
    }
    
    function closeTutorPopup() {
        const popup = document.getElementById("tutor-popup");
        const overlay = document.getElementById("tutor-popup-overlay");
    
        popup.classList.remove("visible");
        overlay.classList.remove("visible");
    
        popup.classList.add("hidden");
        overlay.classList.add("hidden");
    
        document.body.style.overflow = "";
    }
    
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("popup1-close") || event.target.id === "tutor-popup-overlay") {
            closeTutorPopup();
        }
    });

    const filterButton = document.querySelector(".main1-filter-button");
    const filterContainer = document.querySelector(".filter-container");
    const courseButtons = document.querySelectorAll(".course-btn");
    const subjectsList = document.getElementById("subjects-list");

    const subjectsByCourse = {
        "1": [
            "Кыргызская литература (Шамбаева Б.)",
            "Кыргызская литература (Карабаев Д.)",
            "Кыргызская литература (Мамырбаева Н.)",
            "Civics (Grace Horman)",
            "General English (Григгс Самуэль)",
            "Intro to Computers (Asem Begmanova)",
            "Математика (Амракулов М.)",
            "Математика (Беляева О.)",
            "Математика (Якиманская Т.)",
            "Математика (Рахманова А.)",
            "Астрономия (Койчуманова А.)",
            "Биология (Эсеналиев А.)",
            "Всемирная история искусства (Воронина Е.)",
            "Всеобщая история (Кайназарова М.)",
            "Всеобщая история (Сулье Н.)",
            "География (Джусупова Ч.)",
            "География (Келгенбаева К.)",
            "Иностранный язык (Bethan Holland)",
            "Иностранный язык (Ахунджанова С.)",
            "Иностранный язык (Ричард Хокс)",
            "Иностранный язык (Цуканова Н.)",
            "Иностранный язык (Эссенс Тшума)",
            "Информатика (Сарыбаева А.)",
            "Информатика (Тультемирова Г.)",
            "История Кыргызстана (Кайназарова М.)",
            "Кыргызский язык (Карабаев Д.)",
            "Кыргызский язык (Мамырбаева Н.)",
            "Кыргызский язык (Шамбаева Б.)",
            "Математика (Якиманская Т.)",
            "Начальная военная подготовка (Алиев А.)",
            "Основы креативного и критического мышления (Шабалина А.)",
            "Русская литература (Воронина Е.)",
            "Русский язык (Логвиненко В.)",
            "Физика (Бессонов Ф.)",
            "Физика (Койчуманова А.)",
            "Физика (Тельтаева А.)",
            "Химия (Самакбаева М.)"
        ],
        "2": [
            "3D моделирование (Ермаков О.)",
            "Data Acquisition and Webmapping (Grace Horman)",
            "English Composition 2 (Сартини Майкл)",
            "English Composition 2 (Халмурзаева А.)",
            "Introduction to Cartography and ArcGIS (Grace Horman)",
            "Mathematical Analysis I (Burova Elena)",
            "Алгоритмы и структуры данных (Джумабаев Н.)",
            "Анализ и визуализация данных 2 (Джумагулов К.)",
            "Бизнес-моделирование (Дельфин В.)",
            "Бухгалтерский учет (Галимова О.)",
            "Введение в бухгалтерский учет (Галимова О.)",
            "География Кыргызстана (Джусупова Ч.)",
            "Дизайн-мышление (Султанова Д.)",
            "Зеленая архитектура (Кочмарева Л.)",
            "Инновации: история, логика, тренды (Ибраимов Н.)",
            "Искусство звука и дизайн (Осмонов М.)",
            "Искусство иллюстрации (Путятина О.)",
            "Искусство фотографии и дизайн (Койчубеков Ж.)",
            "История и логика предпринимательства (Уметалиева А.)",
            "История Кыргызстана (Кайназарова М.)",
            "Креативное мышление и интеллект (Мовшук А.)",
            "Лидерство и командная работа (Ушакова Д.)",
            "Макроэкономика (Журсун И.)",
            "Маркетинг (Уметалиева А.)",
            "Математический анализ 1 (Вейс П.)",
            "Международные правила и стандарты (Boizeau P.)",
            "Основы веб-разработки (Ташматов А.)",
            "Основы дизайна (Ва-Ахунов Р.)",
            "Основы машинного обучения (Аталов С.)",
            "Разработка ПО (Тультемирова Г.)",
            "Разработка ПО 2 (Тультемирова Г.)",
            "Стартап-менеджмент (Дельфин В.)",
            "Сценарное мастерство (Шабалина А.)",
            "Управление проектами (Садыкова Ж.)",
            "Цифровая экономика (Ибраимов Н.)",
            "Экологическая экономика (Журсун И.)",
            "Экологические нормы и политика (Иманова С.)",
            "Эмоциональное обучение (Султанова Д.)",
            "Энергоэффективность зданий (Торопов М.)"
        ],
        "3": ["FYS 2 (Брюли Ж.)",
            "FYS 2 (Сулье Н.)",
            "Green Spaces in Urban Development (Буазо Ф.)",
            "Анализ и визуализация данных 4 (Бегманова А.)",
            "Анализ и визуализация данных 4 (Каримова Д.)",
            "Анализ и визуализация данных 4 (Кулданбаева М.)",
            "Анализ и визуализация данных 4 (Мырзагулова А.)",
            "Анализ рынков Весна (Кокалюк Е.)",
            "Анимация элементов и создание видео (Толубаев Ж.)",
            "Бизнес-право и налоги (Самсалиева Ч.)",
            "Бизнес-этика и коммуникации (Иманова С.)",
            "Визуализация данных и инфографика (Турдуева Б.)",
            "Визуальное мышление (Путятина О.)",
            "Визуальное повествование (Толубаев Ж.)",
            "Дизайн-антропология (Турдиева Н.)",
            "Информационная безопасность и защита данных (Сарыбаева А.)",
            "Маркетинг (Уметалиева А.)",
            "Математика для бизнеса 2 (Хрущева Р.)",
            "Математика и физика для экологии (Буазо Ф.)",
            "Новое предпринимательство (Уметалиева А.)",
            "Основы кинематографии (Койчубеков Ж.)",
            "Основы системного инжиниринга (Христофориди Д.)",
            "Проектное финансирование и ТЭО (Джусупов А.)",
            "Прототипирование и тестирование (Ва-ахунов Р.)",
            "Прототипирование и тестирование DMDT (Ва-ахунов Р.)",
            "Стартап ресурсы: модели и тренды (Дельфин В.)",
            "Структуры данных и управление БД (Ташматов А.)",
            "Технологии обработки и анализа данных (Аталов С.)",
            "Управление отходами (Келгенбаева К.)",
            "Управленческий учет для стартапов (Галимова О.)"
        ]
    };

    let selectedCourse = "1"; // Загружаем 1 курс по умолчанию
    let selectedSubject = null;
    // Показываем/скрываем фильтр под поисковой строкой
    filterButton.addEventListener("click", function () {
        filterContainer.style.display = filterContainer.style.display === "none" ? "block" : "none";
        loadSubjects(selectedCourse); // Загружаем предметы при первом открытии
    });

    // Выбор курса
    courseButtons.forEach(button => {
        button.addEventListener("click", function () {
            courseButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            selectedCourse = button.getAttribute("data-course");
            selectedSubject = null; // Сбрасываем выбранный предмет
            loadSubjects(selectedCourse);
            filterTutors(); // Фильтруем тьюторов после выбора курса
        });
    });

    // Загрузка предметов для выбранного курса
    function loadSubjects(course) {
        subjectsList.innerHTML = "";
        const subjects = subjectsByCourse[course] || [];

        subjects.forEach(subject => {
            const button = document.createElement("button");
            button.classList.add("subject-btn");
            button.textContent = subject;

            button.addEventListener("click", function () {
                if (button.classList.contains("active")) {
                    button.classList.remove("active");
                    selectedSubject = null;
                } else {
                    subjectsList.querySelectorAll(".subject-btn").forEach(btn => btn.classList.remove("active"));
                    button.classList.add("active");
                    selectedSubject = subject;
                }
                filterTutors(); // Фильтруем тьюторов
            });

            subjectsList.appendChild(button);
        });

        filterTutors(); // Если предмет не выбран, показываем всех
    }

    // Фильтрация тьюторов
    function filterTutors() {
        const tutorBlocks = document.querySelectorAll(".block");

        tutorBlocks.forEach(block => {
            const tutorCourse = block.getAttribute("data-course");
            const tutorSubject = block.getAttribute("data-subject");

            console.log(`Фильтруем тьютора: Курс: ${tutorCourse} | Предмет: ${tutorSubject}`);

            const matchesCourse = selectedCourse === null || tutorCourse === selectedCourse;
            const matchesSubject = selectedSubject === null || tutorSubject.includes(selectedSubject);

            block.style.display = matchesCourse && matchesSubject ? "flex" : "none";
        });
    }
    const resetFilterButton = document.querySelector(".reset-filter-btn");

    resetFilterButton.addEventListener("click", () => {
        // Снимаем активные курсы
        courseButtons.forEach(btn => btn.classList.remove("active"));
        selectedCourse = null;

        // Снимаем активные предметы
        selectedSubject = null;
        subjectsList.querySelectorAll(".subject-btn").forEach(btn => btn.classList.remove("active"));

        // Очищаем список предметов
        subjectsList.innerHTML = "";

        // Показываем всех тьюторов
        filterTutors();
    });
    document.querySelector('[data-course="1"]').click();
    loadTutors(); // Загружаем тьюторов при старте страницы
});






document.querySelectorAll(".tutor-card").forEach(card => {
    card.addEventListener("click", () => {
        const tutorId = card.getAttribute("data-tutor-id");
        const registerBtn = document.getElementById("popup1-register");
        if (registerBtn && tutorId) {
            registerBtn.setAttribute("data-tutor-id", tutorId);
        }
    });
});

// 2. Обработчик кнопки 'Записаться'
// Вставь внутрь обработчика document.getElementById("popup1-register").addEventListener(...)

document.getElementById("popup1-register").addEventListener("click", async () => {
    const btn = document.getElementById("popup1-register");
    const tutorId = btn.getAttribute("data-tutor-id");

    if (!tutorId) {
        alert("Ошибка: ID тьютора не найден.");
        return;
    }

    try {
        const response = await fetch("/send-tutor-request/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({ tutor_id: tutorId })
        });
        

        const text = await response.text();
        console.log("📦 Ответ сервера:", text);

        try {
            const data = JSON.parse(text);
            if (data.status === "ok" || data.status === "already_requested") {
                btn.textContent = "⏳ Запрос отправлен...";
                btn.disabled = true;
                btn.style.cursor = "default";
                btn.classList.add("disabled");
            
                // 💾 Сохраняем ID тьютора и время отправки
                const stored = JSON.parse(localStorage.getItem("requestedTutors")) || {};
                stored[tutorId] = Date.now();  // текущее время
                localStorage.setItem("requestedTutors", JSON.stringify(stored));
            } else {
                alert("Ошибка при отправке письма.");
            }
        } catch (e) {
            alert("❌ Ответ не в формате JSON:\n" + text);
        }

    } catch (error) {
        alert("Ошибка соединения: " + error);
    }
});


// 3. Получение CSRF токена из куки
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}



// ЕСЛИ ЧТО МЕНЯТЬ ТУТ
function showConfirmationPopupIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    const confirmed = params.get("confirmed");
    const studentId = params.get("student_id");

    if (confirmed === "1" && studentId) {
        const key = `confirmation_shown_for_${studentId}`;
        if (localStorage.getItem(key)) {
            console.log("🔁 Popup уже был показан для этого студента.");
            return;
        }

        fetch("/get_csrf/").then(() => {
            const firstName = params.get("first_name") || "Имя";
            const lastName = params.get("last_name") || "Фамилия";
            document.getElementById("confirmed-student-name").textContent = `${firstName} ${lastName}`;


            const popup = document.getElementById("confirmation-popup");
            const overlay = document.getElementById("confirmation-overlay");

            popup.classList.remove("hidden");
            popup.classList.add("visible");

            overlay.classList.remove("hidden");
            overlay.classList.add("visible");

            document.body.style.overflow = "hidden";

            // 💾 Помечаем, что popup уже показан для этого студента
            localStorage.setItem(key, "true");

            // 🔄 Удалим query-параметры после показа
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        });
    }
}

showConfirmationPopupIfNeeded();

function closeConfirmationPopup() {
    const popup = document.getElementById("confirmation-popup");
    const overlay = document.getElementById("confirmation-overlay");

    popup.classList.add("hidden");
    popup.classList.remove("visible");

    overlay.classList.add("hidden");
    overlay.classList.remove("visible");

    document.body.style.overflow = "";
}

