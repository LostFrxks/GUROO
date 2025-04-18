document.addEventListener('DOMContentLoaded', () => {  
    const animationContainer = document.getElementById('animation-container');
    
    if (!animationContainer) {
        console.error("❌ Ошибка: контейнер animation-container не найден.");
        return;
    }
    
    console.log("✅ Контейнер для шариков найден! Запускаем анимацию.");
    
    const maxCircles = 50;

    function createCircle() {
        if (document.querySelectorAll('.circle').length >= maxCircles) return;

        const circle = document.createElement('div');
        const size = Math.random() * 80 + 20;
        const speed = Math.random() * 15 + 10;

        let startX, startY, moveX, moveY;
        const side = Math.floor(Math.random() * 4);

        // Получаем полную высоту страницы
        const fullHeight = document.body.scrollHeight;
        const fullWidth = document.body.scrollWidth; // Учитываем и ширину на всякий случай

        switch (side) {
            case 0: // Верх экрана
                startX = Math.random() * 100; 
                startY = -10; 
                moveX = (Math.random() - 0.5) * 200; 
                moveY = 120; 
                break;
            case 1: // Низ экрана (учитываем всю высоту страницы)
                startX = Math.random() * 100; 
                startY = (fullHeight / window.innerHeight) * 100 + 10; // Динамически рассчитываем в vh
                moveX = (Math.random() - 0.5) * 200; 
                moveY = -120; 
                break;
            case 2: // Левый край
                startX = -10; 
                startY = Math.random() * (fullHeight / window.innerHeight) * 100; // Динамически адаптируем высоту
                moveX = 120; 
                moveY = (Math.random() - 0.5) * 200; 
                break;
            case 3: // Правый край
                startX = 110; 
                startY = Math.random() * (fullHeight / window.innerHeight) * 100; // Динамически адаптируем высоту
                moveX = -120; 
                moveY = (Math.random() - 0.5) * 200; 
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
        
        circle.classList.add('circle');
        circle.addEventListener("click", function (e) {
            e.stopPropagation();
            circle.classList.add("clicked");
        });

        animationContainer.appendChild(circle);

        setTimeout(() => {
            if (circle.getBoundingClientRect().top > fullHeight ||
                circle.getBoundingClientRect().left > fullWidth ||
                circle.getBoundingClientRect().bottom < 0 ||
                circle.getBoundingClientRect().right < 0) {
                circle.remove();
            }
        }, speed * 1000);
    }

    setInterval(createCircle, 400);  // Создаем шарики каждые 400 мс, как в вашем коде
});

function updateContainerHeight() {
    const animationContainer = document.getElementById('animation-container');
    if (animationContainer) {
        animationContainer.style.height = `${document.body.scrollHeight}px`;
    }
}

// Запускаем при загрузке и при изменении размера экрана
window.addEventListener('load', updateContainerHeight);
window.addEventListener('resize', updateContainerHeight);
window.addEventListener('scroll', updateContainerHeight); // Обновлять при прокрутке






document.addEventListener("DOMContentLoaded", function () {
    const daysContainer = document.getElementById("days-container");
    const addDayBtn = document.getElementById("add-day-btn");
    const scheduleInput = document.getElementById("schedule-input");

    const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    const lessonTimes = {
        "1": "08:00 - 09:20",
        "2": "09:30 - 10:50",
        "3": "11:40 - 13:00",
        "4": "13:10 - 14:30",
        "5": "14:40 - 16:00",
        "6": "16:00 - 17:20",
        "7": "17:30 - 19:00"
    };

    let selectedPairsByDay = {}; // Храним выбранные пары по дням

    // ✅ Загружаем сохраненное расписание
    let existingSchedule = JSON.parse(scheduleInput.value || "{}");
    Object.entries(existingSchedule).forEach(([day, pairs]) => {
        pairs.forEach(pair => addDaySlot(day, pair));
    });

    function addDaySlot(selectedDay = "", selectedPair = "") {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day-entry");
    
        const daySelect = document.createElement("select");
        daySelect.name = "days[]";
        daySelect.required = true;
    
        daysOfWeek.forEach(day => {
            const option = document.createElement("option");
            option.value = day;
            option.textContent = day;
            if (day === selectedDay) option.selected = true;
            daySelect.appendChild(option);
        });
    
        const pairSelect = document.createElement("select");
        pairSelect.name = "pairs[]";
        pairSelect.required = true;
    
        function updatePairOptions() {
            const currentDay = daySelect.value;
            const currentValue = pairSelect.value; // ⬅️ сохраняем текущее выбранное значение
            pairSelect.innerHTML = "";
        
            let usedPairs = new Set();
        
            document.querySelectorAll(".day-entry").forEach(entry => {
                let d = entry.querySelector("select[name='days[]']").value;
                let p = entry.querySelector("select[name='pairs[]']").value;
                if (d === currentDay && entry !== dayDiv) {
                    usedPairs.add(p);
                }
            });
        
            Object.keys(lessonTimes).forEach(pairNum => {
                if (!usedPairs.has(pairNum) || pairNum === currentValue) {
                    const option = document.createElement("option");
                    option.value = pairNum;
                    option.textContent = `Пара ${pairNum}`;
                    pairSelect.appendChild(option);
                }
            });
        
            // ✅ выставляем value заново, чтобы select корректно отобразил выбранное
            if (pairSelect.querySelector(`option[value="${currentValue}"]`)) {
                pairSelect.value = currentValue;
            } else {
                // fallback: выбираем первую доступную
                pairSelect.selectedIndex = 0;
            }
        }
    
        updatePairOptions();
    
        // ✅ Отображение времени
        const timeDisplay = document.createElement("span");
        timeDisplay.classList.add("time-display");
        timeDisplay.textContent = lessonTimes[pairSelect.value];
    
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-day");
        deleteBtn.textContent = "";
        deleteBtn.addEventListener("click", () => {
            dayDiv.remove();
            updateScheduleInput();
            updateAllPairOptions();
            addDayBtn.style.display = "inline-block";
        });
    
        daySelect.addEventListener("change", () => {
            selectedPair = ""; // сбрасываем, чтобы обновить пары
            updatePairOptions();
            timeDisplay.textContent = lessonTimes[pairSelect.value];
            updateScheduleInput();
            updateAllPairOptions();
        });
    
        pairSelect.addEventListener("change", () => {
            timeDisplay.textContent = lessonTimes[pairSelect.value];
            updateScheduleInput();
            updateAllPairOptions();
        });
    
        dayDiv.appendChild(daySelect);
        dayDiv.appendChild(pairSelect);
        dayDiv.appendChild(timeDisplay);
        dayDiv.appendChild(deleteBtn);
        daysContainer.appendChild(dayDiv);
    
        updateScheduleInput();
    }

    let updatingPairs = false; // Флаг для предотвращения бесконечного обновления

    function updateAllPairOptions() {
        if (updatingPairs) return;
        updatingPairs = true;
    
        document.querySelectorAll(".day-entry").forEach(entry => {
            const daySelect = entry.querySelector("select[name='days[]']");
            const pairSelect = entry.querySelector("select[name='pairs[]']");
            const currentDay = daySelect.value;
            const selectedPair = pairSelect.value;
    
            let usedPairs = new Set();
    
            document.querySelectorAll(".day-entry").forEach(otherEntry => {
                const d = otherEntry.querySelector("select[name='days[]']").value;
                const p = otherEntry.querySelector("select[name='pairs[]']").value;
                if (d === currentDay && otherEntry !== entry) {
                    usedPairs.add(p);
                }
            });
    
            pairSelect.innerHTML = "";
            Object.keys(lessonTimes).forEach(pairNum => {
                if (!usedPairs.has(pairNum) || pairNum === selectedPair) {
                    const option = document.createElement("option");
                    option.value = pairNum;
                    option.textContent = `Пара ${pairNum}`;
                    pairSelect.appendChild(option);
                }
            });
    
            // ✅ выставляем обратно выбранное значение, если оно осталось
            if (pairSelect.querySelector(`option[value="${selectedPair}"]`)) {
                pairSelect.value = selectedPair;
            } else {
                pairSelect.selectedIndex = 0;
            }
        });
    
        updatingPairs = false;
    }
    

    function updateScheduleInput() {
        let schedule = {};
        let totalEntries = document.querySelectorAll(".day-entry").length; // ✅ Добавил подсчет записей
    
        document.querySelectorAll(".day-entry").forEach(entry => {
            const day = entry.querySelector("select[name='days[]']").value;
            const pair = entry.querySelector("select[name='pairs[]']").value;
            
            if (!schedule[day]) {
                schedule[day] = [];
            }
            schedule[day].push(pair);
        });
    
        document.getElementById("schedule-input").value = JSON.stringify(schedule);
    
        // ✅ Ограничение на 2 записи
        const checker = document.getElementById("schedule-checker");

        if (totalEntries >= 2) {
            addDayBtn.style.display = "none";
            checker.setCustomValidity(""); // сбрасываем
        } else if (totalEntries > 0) {
            addDayBtn.style.display = "inline-block";
            checker.setCustomValidity(""); // сбрасываем
        } else {
            checker.setCustomValidity("Пожалуйста, выберите хотя бы один день и время.");
            checker.reportValidity();
        }

    }

    addDayBtn.addEventListener("click", () => addDaySlot());
});

document.addEventListener("DOMContentLoaded", function () {
    const courseSelect = document.getElementById("course");
    const subjectInput = document.getElementById("subject");
    const subjectList = document.getElementById("subject-list");

    // Предметы по курсам
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


    function updateSubjectList() {
        subjectList.innerHTML = "";
        subjectList.style.display = "none"; // Скрываем список перед обновлением

        const selectedCourse = courseSelect.value;
        const subjects = subjectsByCourse[selectedCourse] || [];

        if (!subjects.length) {
            return;
        }

        subjects.forEach(subject => {
            const listItem = document.createElement("li");
            listItem.textContent = subject;
            listItem.addEventListener("click", () => {
                subjectInput.value = subject;
                subjectList.style.display = "none";
            });
            subjectList.appendChild(listItem);
        });

        subjectList.style.display = "block"; // Показываем список после обновления
    }

    courseSelect.addEventListener("change", () => {
        subjectInput.value = "";
        subjectInput.disabled = false; // Разблокируем поле
        updateSubjectList();
    });

    subjectInput.addEventListener("focus", function () {
        if (subjectList.children.length > 0) {
            subjectList.style.display = "block";
        }
    });

    subjectInput.addEventListener("input", function () {
        const query = subjectInput.value.toLowerCase();
        let found = false;
        Array.from(subjectList.children).forEach(item => {
            if (item.textContent.toLowerCase().includes(query)) {
                item.style.display = "block";
                found = true;
            } else {
                item.style.display = "none";
            }
        });

        subjectList.style.display = found ? "block" : "none";
    });

    document.addEventListener("click", function (event) {
        if (!subjectInput.contains(event.target) && !subjectList.contains(event.target)) {
            subjectList.style.display = "none";
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("tutor-form");

    if (!form) {
        console.error("❌ Ошибка: форма не найдена.");
        return;
    }

    function validateSchedule() {
        let isValid = true;
        let selectedPairs = new Map(); // Используем Map для хранения комбинаций "день-время"

        let dayInputs = document.querySelectorAll(".day-entry");

        // ✅ Очищаем все старые ошибки перед проверкой
        dayInputs.forEach(entry => {
            let pairSelect = entry.querySelector("select[name='pairs[]']");
            pairSelect.setCustomValidity("");
            pairSelect.classList.remove("error");
        });

        dayInputs.forEach(entry => {
            let day = entry.querySelector("select[name='days[]']").value;
            let time = entry.querySelector("select[name='pairs[]']").value;

            if (!day || !time) return;

            let key = `${day}-${time}`;

            if (selectedPairs.has(key)) {
                isValid = false;
                let pairSelect = entry.querySelector("select[name='pairs[]']");
                pairSelect.setCustomValidity("Этот временной слот уже занят.");
                pairSelect.classList.add("error");
                pairSelect.reportValidity();
            } else {
                selectedPairs.set(key, true);
            }
        });

        return isValid;
    }

    function attachScheduleValidation() {
        document.querySelectorAll("select[name='days[]'], select[name='pairs[]']").forEach(select => {
            select.addEventListener("change", () => {
                validateSchedule();
            });
        });
    }

    attachScheduleValidation();

    form.addEventListener("submit", function (event) {
        event.preventDefault();  // Отмена стандартной отправки

        let isValid = true;
        let formData = new FormData(form);

        // **Очищаем старые ошибки**
        form.querySelectorAll(".error-message").forEach(el => el.remove());
        form.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
        form.querySelectorAll("input, select, textarea").forEach(field => {
            field.setCustomValidity(""); // ✅ Сбрасываем ошибки перед проверкой
        });

        // **Проверяем обязательные поля**
        form.querySelectorAll("input[required], select[required], textarea[required]").forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add("error");
                field.setCustomValidity("Заполните это поле.");
                field.reportValidity(); // Показывает встроенное сообщение
            } else {
                field.setCustomValidity("");
            }
        });

        // **Проверка поля Telegram-группы**
        const telegramField = document.getElementById("telegram");

        telegramField.addEventListener("input", () => {
            telegramField.setCustomValidity("");     // сбрасываем кастомную ошибку
            telegramField.classList.remove("error"); // убираем стили
        });

        // Внутри submit-обработчика:
        const telegramValue = telegramField.value.trim();
        const validPrefix = "https://t.me/";

        if (telegramValue && !telegramValue.startsWith(validPrefix)) {
            isValid = false;
            telegramField.classList.add("error");
            telegramField.setCustomValidity("Ссылка должна начинаться с https://t.me/");
            telegramField.reportValidity();
        } else {
            telegramField.setCustomValidity("");
        }


        // **Проверяем курс**
        const courseField = document.getElementById("course");
        if (courseField) {
            courseField.setCustomValidity(""); // ✅ Сбрасываем ошибку перед проверкой
            if (!courseField.value.trim()) {
                isValid = false;
                courseField.classList.add("error");
                courseField.setCustomValidity("Выберите курс.");
                courseField.reportValidity();
            }
        }

        const phoneField = document.getElementById("phone");
        if (phoneField) {
            phoneField.setCustomValidity(""); // ✅ Сбрасываем ошибку перед проверкой
            if (!phoneField.value.trim()) {
                isValid = false;
                phoneField.classList.add("error");
                phoneField.setCustomValidity("Введите номер телефона");
                phoneField.reportValidity();
            }
        }

        // **Проверяем уникальность расписания (дни и пары)**
        if (!validateSchedule()) {
            isValid = false;
        }
        // **Проверяем, что хотя бы один день добавлен**

        
        // **Если ошибки есть, не отправляем форму**
        if (!isValid) return;

        // **Отправка формы**
        fetch("/edit_tutor_profile/", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = "/tutors/";
            } else {
                console.error("Ошибка сервера:", data);
                showServerErrors(data.errors);
            }
        })
        .catch(error => console.error("❌ Ошибка сохранения:", error));
    });

    // **Функция обработки ошибок от сервера**
    function showServerErrors(errors) {
        Object.keys(errors).forEach(fieldName => {
            let field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add("error");
                field.setCustomValidity(errors[fieldName][0]);
                field.reportValidity();

                // ✅ Автоматически очищаем ошибку при вводе нового значения
                field.addEventListener("input", () => {
                    field.setCustomValidity("");
                    field.classList.remove("error");
                }, { once: true });
            }
        });
    }
});

