document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Проверяем авторизацию...");

    let userIdElement = document.querySelector("#user-id");
    let userId = userIdElement ? userIdElement.textContent.trim() : null;
    console.log("🔍 Проверка userId:", userId);

    const profileButton = document.getElementById("profile-button");
    const popup = document.getElementById("profile-popup");
    const closePopup = document.getElementById("close-popup");
    const tutorsList = document.getElementById("registered-tutors");
    const studentName = document.getElementById("student-name");
    const logoutButton = document.getElementById("logout-button");
    const scheduleDisplay = document.getElementById("schedule-display");

    const popupOverlay = document.createElement("div");
    popupOverlay.classList.add("popup-overlay", "hidden");
    document.body.appendChild(popupOverlay);

    if (!userId || isNaN(userId)) {
        console.error("❌ Ошибка: Некорректный userId!", userId);
        return;
    }

    function getCSRFToken() {
        return document.cookie.split("; ")
            .find(row => row.startsWith("csrftoken="))
            ?.split("=")[1];
    }

    function loadTutors() {
        fetch(`/api/get_tutors/?user_id=${userId}`)
            .then(response => response.json())
            .then(tutors => {
                const container = document.querySelector('.blocks');
                container.innerHTML = "";

                tutors.forEach(tutor => {
                    const block = document.createElement('div');
                    block.classList.add('block');

                    let scheduleContent = "";
                    if (tutor.schedule && Object.keys(tutor.schedule).length > 0) {
                        scheduleContent = Object.entries(tutor.schedule).map(([day, times]) => {
                            if (!Array.isArray(times)) {
                                times = [times]; 
                            }
                            return `<li>${day}: ${times.join(", ")}</li>`;
                        }).join("");
                    } else {
                        scheduleContent = "<li>Нет доступных слотов</li>";
                    }

                    let actionContent = "";
                    if (tutor.is_registered) {
                        if (tutor.attended) {
                            actionContent = `<p class="attended-text">✅ Вы уже отметились</p>`;
                        } else {
                            actionContent = `<button class="btn-attendance" data-id="${tutor.id}">Я присутствую</button>`;
                        }
                    } else if (tutor.is_pending) {
                        actionContent = `<p class="pending-text">⏳ Ожидает подтверждения</p>`;
                    } else {
                        actionContent = `<button class="btn-register" data-id="${tutor.id}">Записаться</button>`;
                    }

                    block.innerHTML = `
                        <div class="profile_photo">
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
                });
            })
            .catch(error => console.error("❌ Ошибка загрузки тьюторов:", error));
    }

    function logoutUser() {
        console.log("⏳ Отправка запроса на logout...");
        fetch("/api/logout/", {
            method: "POST",
            headers: { "X-CSRFToken": getCSRFToken() }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.replace("/login/");
                }
            })
            .catch(error => console.error("❌ Ошибка выхода:", error));
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logoutUser);
    }

    function loadRegisteredTutors() {
        fetch(`/api/get_registered_tutors/?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                console.log("📌 Данные от API:", data);
    
                tutorsList.innerHTML = "";
    
                let tutors = Array.isArray(data) ? data : (data.tutors || []);
                let students = data.students || [];
    
                console.log("➡️ Обработанные тьюторы:", tutors);
                console.log("➡️ Обработанные студенты:", students);
    
                if (!tutors.length && !students.length) {
                    console.warn("⚠️ Нет записей!");
                    tutorsList.innerHTML = "<li>Вы пока не записаны ни к кому</li>";
                    return;
                }
    
                if (students.length) {
                    tutorsList.innerHTML += "<strong>Ваши студенты:</strong>";
                    students.forEach(student => {
                        const li = document.createElement("li");
                        li.textContent = `${student.name || "Неизвестный"} (${student.email})`;
                        tutorsList.appendChild(li);
                    });
                }
    
                if (tutors.length) {
                    console.log("✅ Найдены тьюторы:", tutors);
                    tutorsList.innerHTML += "<strong>Ваши тьюторы:</strong>";
    
                    tutors.forEach(tutor => {
                        console.log("➤ Добавляем в список:", tutor);
                        const li = document.createElement("li");
                        li.textContent = `${tutor.name || "Неизвестный"} (${tutor.subject})`;
                        tutorsList.appendChild(li);
                    });
                }
            })
            .catch(error => console.error("❌ Ошибка загрузки тьюторов:", error));
    }

    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("btn-register")) {
            let tutorId = event.target.getAttribute("data-id");
            console.log("📩 Отправляем запрос на запись к тьютору...", { tutorId, userId });

            fetch(`/api/register_tutor/${tutorId}/${userId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                }
            })
                .then(response => response.json())
                .then(data => {
                    console.log("✅ Ответ от сервера:", data);
                    if (data.success) {
                        event.target.parentElement.innerHTML = `<p class="pending-text">⏳ Ожидает подтверждения</p>`;
                    }
                })
                .catch(error => console.error("❌ Ошибка записи:", error));
        }

        if (event.target.classList.contains("btn-attendance")) {
            let tutorId = event.target.getAttribute("data-id");
            console.log("📌 Отмечаем присутствие", { tutorId, userId });

            fetch(`/api/mark_attendance/${tutorId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        event.target.parentElement.innerHTML = `<p class="attended-text">✅ Вы уже отметились</p>`;
                    }
                })
                .catch(error => console.error("❌ Ошибка посещения:", error));
        }

        if (event.target.closest("#avatar") || event.target.closest("#user-name")) {
            console.log("👤 Открываем попап профиля");
            studentName.textContent = `Студент: ${document.getElementById("user-name").textContent}`;
            loadRegisteredTutors();
            popup.classList.add("visible");
            popupOverlay.classList.add("visible");
        }
    });

    closePopup.addEventListener("click", function () {
        console.log("❌ Закрываем попап профиля");
        popup.classList.remove("visible");
        popupOverlay.classList.remove("visible");
    });

    popupOverlay.addEventListener("click", function () {
        console.log("❌ Закрытие попапа при клике вне окна");
        popup.classList.remove("visible");
        popupOverlay.classList.remove("visible");
    });

    loadTutors();
    console.log("✅ Готово!");
});
