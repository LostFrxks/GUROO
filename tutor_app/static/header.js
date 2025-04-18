function getCSRFToken() {
    return document.cookie.split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
}

function loadNotificationCount() {
    fetch('/get_notifications/')
        .then(response => response.json())
        .then(data => {
            const countEl = document.getElementById("notification-count");
            if (!countEl) {
                console.warn("❌ Не найден #notification-count");
                return;
            }

            const tutorRequests = data.notifications.filter(n => n.type === "tutor_request");
            console.log("📬 Найдено tutor_request:", tutorRequests.length);

            if (tutorRequests.length > 0) {
                countEl.textContent = tutorRequests.length;
                countEl.style.display = 'inline-block';
            } else {
                countEl.textContent = '0';
                countEl.style.display = 'none';
            }
        })
        .catch(error => console.error("❌ Ошибка счётчика уведомлений:", error));
}

let userId = null;
let currentScreen = "tutors";
let lessonState = {
    topic: "",
    location: "",
    showFields: false
};


document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Скрипт загружен");
    loadNotificationCount();
    setTimeout(loadNotificationCount, 50);
    const popup = document.getElementById("profile-popup");
    const popupOverlay = document.getElementById("popup-overlay");

    let userIdElement = document.querySelector("#user-id");
    userId = userIdElement ? userIdElement.textContent.trim() : null;

    console.log("🔵 User ID:", userId);

    let userRoleElement = document.querySelector("#user-role");
    let userRole = userRoleElement ? userRoleElement.textContent.trim() : "student";
    console.log("😺 User Role:", userRole);

    let userNameElement = document.getElementById("user-name");
    let userName = userNameElement ? userNameElement.textContent.trim() : "Неизвестный";
    console.log("👤 Имя пользователя:", userName);

    const profileButton = document.getElementById("profile-button");
    const closePopupButton = document.getElementById("close-popup");
    const tutorsList = document.getElementById("registered-tutors");
    const studentName = document.getElementById("student-name");

    
    // **Создаем выпадающее меню профиля**
    const profileMenu = document.createElement("div");
    profileMenu.classList.add("profile-menu", "hidden");
    document.body.appendChild(profileMenu);


    const lessonsPopup = document.getElementById("lessons-popup");
    const lessonsOverlay = document.getElementById("lessons-overlay");
    const lessonsList = document.getElementById("my-lessons-list");
    const noLessonsMsg = document.getElementById("no-lessons-msg");

    function renderProfileMenu() {
        profileMenu.innerHTML = `
        <ul>
            ${userRole === "tutor" ? `<li id="my-lessons-btn">📆 Мои уроки</li>` : ""}
            <li id="show-tutors">📚 Ваши тьюторы</li>
            ${userRole === "tutor" ? `<li><a href="/edit_tutor_profile/">📄 Моя анкета</a></li>` : ""}
            <li id="logout">🚪 Выйти</li>
        </ul>
        `;

        const logoutBtn = document.getElementById("logout");
        const showTutorsBtn = document.getElementById("show-tutors");
        const myLessonsBtn = document.getElementById("my-lessons-btn");

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => logoutUser());
        }

        if (showTutorsBtn) {
            showTutorsBtn.addEventListener("click", () => {
                console.log("📣 Клик по кнопке 'Ваши тьюторы'");
                studentName.textContent = (userRole === "tutor" ? "Тьютор: " : "Студент: ") + userName;
                loadRegisteredTutors();
                popupOverlay.style.display = "block"; // ⬅️ фикс
                popup.style.display = "block";

                popup.classList.remove("hidden");
                popupOverlay.classList.remove("hidden");
                popup.classList.add("visible");
                popupOverlay.classList.add("visible");
            });
        }

        if (myLessonsBtn) {
            myLessonsBtn.addEventListener("click", () => {
                fetch(`/get_my_lessons/?tutor_id=${userId}`)
                    .then(res => res.json())
                    .then(data => {
                        lessonsList.innerHTML = "";
                        const showFields = data.show_fields;
                        lessonState.showFields = showFields;
                        lessonState.topic = data.topic || "";
                        lessonState.location = data.location || "";
                                                
                        const saveButton = lessonsPopup.querySelector("#save-lesson");

                        document.getElementById("save-lesson")?.classList.toggle("hidden", !showFields);

        
                        const divider = document.createElement("hr");
                        lessonsList.appendChild(divider);
        
                        if (!data.lessons || data.lessons.length === 0) {
                            noLessonsMsg.style.display = "block";
                            return;
                        }
        
                        noLessonsMsg.style.display = "none";
        
                        data.lessons.forEach((student) => {
                            const li = document.createElement("li");
                            li.classList.add("lesson-entry");
        
                            li.innerHTML = `👤 <strong>${student.first_name} ${student.last_name}</strong> (${student.group || "группа не указана"})`;
        
                            lessonsList.appendChild(li);
                        });
                    });
        
                lessonsPopup.classList.add("visible");
                lessonsOverlay.classList.add("visible");
            });
        }
        

        const closeLessonsBtn = document.getElementById("close-lessons");

        if (closeLessonsBtn) {
            closeLessonsBtn.addEventListener("click", () => {
                lessonsPopup.classList.remove("visible");
                lessonsOverlay.classList.remove("visible");
            });
        }
        if (lessonsOverlay) {
            lessonsOverlay.addEventListener("click", () => {
                lessonsPopup.classList.remove("visible");
                lessonsOverlay.classList.remove("visible");
            });
        }

        const closePopupBtn = document.getElementById("close-popup");
        if (closePopupBtn) {
            closePopupBtn.addEventListener("click", () => {
                popup.classList.remove("visible");
                popupOverlay.classList.remove("visible");
                popup.classList.add("hidden");
                popupOverlay.classList.add("hidden");
                popup.style.display = "none"; // 👈 вот это
                popupOverlay.style.display = "none"; // 👈 и это
            });
        }
        
        if (popupOverlay) {
            popupOverlay.addEventListener("click", () => {
                popup.classList.remove("visible");
                popupOverlay.classList.remove("visible");
                popup.classList.add("hidden");
                popupOverlay.classList.add("hidden");
                popup.style.display = "none"; // 👈 снова
                popupOverlay.style.display = "none";
            });
        }
        
    }
    
    function logoutUser() {
        console.log("🔴 Отправка запроса на logout...");

        fetch("/logout/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log("✅ Успешный выход:", data.message);

                // ❗️ Очистка кеша браузера
                window.location.href = "/login/";
                window.location.replace("/login/");  // Перенаправление без сохранения истории
                window.history.pushState({}, "", "/login/"); // Очищаем историю переходов

                // ❗️ Очищаем куки
                document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });

            } else {
                console.error("❌ Ошибка выхода:", data.message);
            }
        })
        .catch(error => console.error("Ошибка выхода:", error));
    }

    function toggleProfileMenu() {
        console.log("🧑‍🎓 Открываем меню профиля");

        const rect = avatar.getBoundingClientRect();  // Получаем позицию аватара

        profileMenu.style.position = "absolute";
        profileMenu.style.top = `${rect.bottom + 10}px`;  // Размещаем меню под аватаром
        profileMenu.style.left = `${rect.left}px`;
        profileMenu.style.width = "180px";  // Ширина меню

        const isVisible = profileMenu.classList.toggle("visible");

        if (isVisible) {
            profileMenu.classList.remove("hidden");
            profileMenu.style.opacity = "1";
            profileMenu.style.visibility = "visible";
            profileMenu.style.transform = "translateY(0)";
        } else {
            profileMenu.style.opacity = "0";
            profileMenu.style.visibility = "hidden";
            profileMenu.style.transform = "translateY(-10px)";
        }

        if (lessonsOverlay) {
            lessonsOverlay.addEventListener("click", () => {
                lessonsPopup.classList.remove("visible");
                lessonsOverlay.classList.remove("visible");
            });
        }
    }

    // Добавляем обработчик клика на аватар
    avatar.addEventListener("click", function (event) {
        event.stopPropagation();  // Останавливаем дальнейшее распространение события
        toggleProfileMenu();  // Открываем/закрываем меню
    });

    // Закрытие меню при клике вне меню или аватара
    document.addEventListener("click", function (event) {
        if (!profileMenu.contains(event.target) && !avatar.contains(event.target)) {
            profileMenu.classList.remove("visible");
            profileMenu.style.opacity = "0";
            profileMenu.style.visibility = "hidden";
            profileMenu.style.transform = "translateY(-10px)";
        }
    });
    
    renderProfileMenu();

    if (!profileButton) {
        console.warn("⚠️ Пользователь не авторизован — скрываем попап.");
        if (popup) popup.style.display = "none";
        if (popupOverlay) popupOverlay.style.display = "none";
        return;
    }
    profileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleProfileMenu();
    });

    document.addEventListener("click", function (event) {
        if (!profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
            profileMenu.classList.remove("visible");
            profileMenu.style.opacity = "0";
            profileMenu.style.visibility = "hidden";
            profileMenu.style.transform = "translateY(-10px)";
        }
    });

    // **Функция загрузки списка тьюторов**
    function loadRegisteredTutors() {
        console.log("📌 Загружаем тьюторов...");
        fetch(`/get_schedule_with_attendance/`)
            .then(response => response.json())
            .then(data => {
                tutorsList.innerHTML = "";
                const tutors = data.schedule || [];
    
                if (!tutors.length) {
                    tutorsList.innerHTML = "<li>Вы пока не записаны ни к кому</li>";
                    return;
                }
    
                tutors.forEach(tutor => {
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("tutor-card");
    
                    const mainInfo = document.createElement("div");
                    mainInfo.classList.add("tutor-main");
    
                    const name = document.createElement("div");
                    name.innerHTML = `<strong>${tutor.tutor_name}</strong><br>${tutor.subject}`;
                    name.classList.add("tutor-name");
    
                    const toggleBtn = document.createElement("button");
                    toggleBtn.innerHTML = "⬇️";
                    toggleBtn.classList.add("toggle-schedule-btn");
    
                    mainInfo.appendChild(name);
                    mainInfo.appendChild(toggleBtn);
                    wrapper.appendChild(mainInfo);
    
                    const scheduleBlock = document.createElement("div");
                    scheduleBlock.classList.add("schedule-block", "hidden");
    
                    if (!tutor.schedule.length) {
                        scheduleBlock.innerHTML = "<p>Нет расписания</p>";
                    } else {
                        tutor.schedule.forEach(s => {
                            const pair = document.createElement("div");
                            pair.classList.add("pair-block");
                            pair.innerHTML = `<strong>${s.day}</strong> — ${s.time}`;
    
                            // Если можно отметиться, показываем кнопку
                            if (s.can_mark && !tutor.already_marked) {
                                const markBtn = document.createElement("button");
                                markBtn.textContent = "✅ Отметиться";
                                markBtn.classList.add("mark-button");
    
                                markBtn.addEventListener("click", () => {
                                    fetch("/submit_attendance/", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "X-CSRFToken": getCSRFToken()
                                        },
                                        body: JSON.stringify({
                                            tutor_id: tutor.tutor_id
                                        })
                                    }).then(r => r.json())
                                      .then(res => {
                                          if (res.success) {
                                              alert("Вы успешно отметились!");
                                              loadRegisteredTutors(); // перезагружаем всё
                                          } else {
                                              alert(res.error || "Ошибка");
                                          }
                                      });
                                });
    
                                pair.appendChild(markBtn);
                            }
    
                            scheduleBlock.appendChild(pair);
                        });
                    }
    
                    wrapper.appendChild(scheduleBlock);
                    tutorsList.appendChild(wrapper);
    
                    toggleBtn.addEventListener("click", () => {
                        scheduleBlock.classList.toggle("hidden");
                        scheduleBlock.classList.toggle("expanded");
                        toggleBtn.textContent = scheduleBlock.classList.contains("hidden") ? "⬇️" : "⬆️";
                    });
                });
            })
            .catch(error => {
                console.error("❌ Ошибка загрузки тьюторов:", error);
                tutorsList.innerHTML = "<li>Ошибка загрузки данных</li>";
            });
    }
    
    

    function openTutorSchedule(tutorId, tutorName) {
        fetch(`/get_schedule_with_attendance/`)
            .then(res => res.json())
            .then(data => {
                const popup = document.getElementById("tutor-schedule-popup");
                const overlay = document.getElementById("popup-overlay");
                const list = document.getElementById("tutor-schedule-list");
                const title = document.getElementById("tutor-name-title");
                const form = document.getElementById("attendance-form");
    
                list.innerHTML = "";
                form.classList.add("hidden");
                title.textContent = `Расписание: ${tutorName}`;
    
                let found = data.schedule.find(t => t.tutor_id == tutorId);
                if (!found) {
                    list.innerHTML = "<li>Нет доступных пар</li>";
                } else {
                    found.schedule.forEach(s => {
                        const li = document.createElement("li");
                        li.innerHTML = `${s.day}, ${s.time} ${s.can_mark ? "✅ <button class='mark-btn'>Отметиться</button>" : ""}`;
                        list.appendChild(li);
    
                        if (s.can_mark && !found.already_marked) {
                            form.classList.remove("hidden");
                            document.getElementById("submit-attendance").onclick = function () {
                                const topic = document.getElementById("lesson-topic").value;
                                const location = document.getElementById("lesson-location").value;
                                fetch("/submit_attendance/", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "X-CSRFToken": getCSRFToken()
                                    },
                                    body: JSON.stringify({
                                        tutor_id: tutorId,
                                        topic: topic,
                                        location: location
                                    })
                                }).then(r => r.json())
                                .then(res => {
                                    if (res.success) {
                                        alert("Вы отметились!");
                                        popup.classList.remove("visible");
                                        overlay.classList.remove("visible");
                                    } else {
                                        alert(res.error || "Ошибка");
                                    }
                                });
                            };
                        }
                    });
                }
    
                popup.classList.add("visible");
                overlay.classList.add("visible");
            });
    }


        // 🔒 Закрытие popup расписания тьютора
    const schedulePopup = document.getElementById("tutor-schedule-popup");
    const closeScheduleBtn = document.getElementById("close-schedule-popup");

    if (closeScheduleBtn) {
        closeScheduleBtn.addEventListener("click", () => {
            schedulePopup.classList.remove("visible");
            document.getElementById("popup-overlay").classList.remove("visible");
        });
    }
});



document.addEventListener("DOMContentLoaded", function () {
    const notificationBell = document.querySelector("#notification-bell i");
    const notificationCount = document.getElementById("notification-count");  // Счетчик уведомлений
    const notificationPopup = document.getElementById("notification-popup");
    const notificationsList = document.getElementById("notifications-list");
    const closeNotificationsButton = document.getElementById("close-notifications");
    const popupOverlay = document.getElementById("popup-overlay");

    // Функция для загрузки уведомлений и обновления счетчика
    function loadNotifications() {
        fetch('/get_notifications/')
            .then(response => response.json())
            .then(data => {
                notificationsList.innerHTML = '';
                if (data.notifications.length === 0) {
                    document.getElementById("no-notifications-msg").style.display = 'block';
                    notificationCount.style.display = 'none';
                } else {
                    document.getElementById("no-notifications-msg").style.display = 'none';
                    data.notifications.forEach(notification => {
                        const li = document.createElement("li");
            
                        // ✅ Бишкекское время
                        const utcDate = new Date(notification.timestamp);
                        const bishkekDate = utcDate.toLocaleString("ru-RU", {
                            timeZone: "Asia/Bishkek",
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        });
            
                        li.innerHTML = `${notification.message} <br><small>${bishkekDate}</small>`;
                        notificationsList.appendChild(li);
                    });
            
                    notificationCount.textContent = data.notifications.length;
                    notificationCount.style.display = 'inline-block';
                }
            
                notificationPopup.classList.add("visible");
            })
            .catch(error => console.error("❌ Ошибка загрузки уведомлений:", error));
    }

    notificationBell.addEventListener("click", () => {
        loadNotifications();
        notificationPopup.classList.remove("hidden");
        popupOverlay.classList.remove("hidden");
        notificationPopup.style.display = "block";
        popupOverlay.style.display = "block";
        notificationPopup.classList.add("visible");
        popupOverlay.classList.add("visible");
    });

    // Закрытие уведомлений
    closeNotificationsButton.addEventListener("click", function () {
        popupOverlay.classList.remove("visible");
        notificationPopup.style.display = "none";
        popupOverlay.style.display = "none";    
    });
    popupOverlay.addEventListener("click", function(){
        popupOverlay.classList.remove("visible");
        notificationPopup.style.display = "none";
        popupOverlay.style.display = "none";    
    });
    // Функция для отправки уведомлений, когда тьютор подтверждает студента
    function sendAcceptanceNotification(studentId, tutorName, subject) {
        fetch('/send_acceptance_notification/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                student_id: studentId,
                tutor_name: tutorName,
                subject: subject
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Уведомление отправлено');
            }
        })
        .catch(error => console.error('Ошибка при отправке уведомления:', error));
    }

    // Получение CSRF токена
    function getCSRFToken() {
        return document.cookie.split("; ")
            .find(row => row.startsWith("csrftoken="))
            ?.split("=")[1];
    }
}); 


document.addEventListener("click", function (e) {
    if (e.target.classList.contains("inline-approve")) {
        const studentId = e.target.dataset.studentId;
        const tutorId = e.target.dataset.tutorId;

        fetch("/confirm-via-notification/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            body: JSON.stringify({ student_id: studentId, tutor_id: tutorId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                e.target.parentElement.innerHTML = `Вы приняли заявку от ${e.target.dataset.studentName}`;
            }
        });
    }

    if (e.target.classList.contains("inline-decline")) {
        const studentId = e.target.dataset.studentId;
        const tutorId = e.target.dataset.tutorId;
        const studentName = e.target.dataset.studentName;
    
        fetch("/decline-tutor-request/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            body: JSON.stringify({ student_id: studentId, tutor_id: tutorId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                e.target.parentElement.innerHTML = `❌ Вы отклонили заявку от ${studentName}`;
            } else {
                e.target.parentElement.innerHTML = "⚠️ Ошибка отклонения";
            }
        })
        .catch(err => {
            console.error("Ошибка удаления:", err);
            e.target.parentElement.innerHTML = "⚠️ Ошибка удаления";
        });
    }




// === Глобальные переменные для состояний ===
// === Переход к экрану расписания и ввода темы/места ===
function goToLessonScreen() {
    currentScreen = "lesson";

    const lessonsList = document.getElementById("my-lessons-list");
    const noLessonsMsg = document.getElementById("no-lessons-msg");
    const backBtn = document.getElementById("back-to-tutors");
    const title = document.getElementById("lessons-title");
    const topicInput = document.getElementById("lesson-topic");
    const locationInput = document.getElementById("lesson-location");
    const scheduleList = document.getElementById("lesson-schedule");

    // 👇 Время пар
    const lessonTimes = {
        "1": "08:00 — 9:20",
        "2": "09:30 — 10:50",
        "3": "11:40 — 13:00",
        "4": "13:10 — 14:30",
        "5": "14:40 — 16:00",
        "6": "16:10 — 17:30",
        "7": "17:40 — 19:00"
    };

    // 🔄 Скрываем первый экран
    if (lessonsList) lessonsList.classList.add("hidden");
    if (noLessonsMsg) noLessonsMsg.style.display = "none";
    if (backBtn) backBtn.classList.remove("hidden");
    if (title) title.textContent = "Урок:";

    // 🔄 Загружаем с сервера расписание и show_fields
    fetch(`/get_my_lessons/?tutor_id=${userId}`)
        .then(res => res.json())
        .then(data => {
            const showFields = data.show_fields;
            lessonState.showFields = showFields;  // сохраняем состояние

            // 🎯 Показываем или скрываем поля
            if (topicInput) {
                topicInput.classList.remove("hidden");
                topicInput.value = lessonState.topic || "";
                topicInput.style.display = lessonState.showFields ? "block" : "none";
            }
            if (locationInput) {
                locationInput.classList.remove("hidden");
                locationInput.value = lessonState.location || "";
                locationInput.style.display = lessonState.showFields ? "block" : "none";
            }
            console.log(topicInput);
            console.log(locationInput);

            console.log("📦 Расписание пришло:", data.schedule);
            console.log("📌 Показывать поля?", showFields);

            const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

            // 📅 Отображаем расписание
            if (data.schedule && scheduleList) {
                scheduleList.innerHTML = ""; // очистка

                Object.entries(data.schedule)
                    .sort(([dayA], [dayB]) => dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB))
                    .forEach(([day, pairNums]) => {
                        const sortedPairs = pairNums.map(Number).sort((a, b) => a - b);

                        sortedPairs.forEach(pairNum => {
                            const div = document.createElement("div");
                            div.className = "pair-block";

                            const time = lessonTimes[pairNum];
                            div.innerText = time
                                ? `${day}, ${time}`
                                : `${day}, пара №${pairNum}`;

                            console.log("🧱 Добавлен блок:", div.innerText);
                            scheduleList.appendChild(div);
                        });
                    });
            } else {
                console.warn("⚠️ Нет расписания для отображения", data.schedule);
            }
        });
}


// === Возврат к списку тьюти ===
function goToTutorsScreen() {
    currentScreen = "tutors";
    const lessonsList = document.getElementById("my-lessons-list");
    const noLessonsMsg = document.getElementById("no-lessons-msg");
    const backBtn = document.getElementById("back-to-tutors");
    const topicInput = document.getElementById("lesson-topic");
    const locationInput = document.getElementById("lesson-location");
    console.log("📎 topicInput:", topicInput);
    console.log("📎 locationInput:", locationInput);
    

    const scheduleList = document.getElementById("lesson-schedule");
    const title = document.getElementById("lessons-title");
    if (title) title.textContent = "Ваши тьюти:";
    if (topicInput) {
        topicInput.classList.add("hidden");
        topicInput.style.display = "none";
    }
    if (locationInput) {
        locationInput.classList.add("hidden");
        locationInput.style.display = "none";
    }
    
    if (lessonsList) lessonsList.classList.remove("hidden");
    if (noLessonsMsg) noLessonsMsg.style.display = "block";
    if (backBtn) backBtn.classList.add("hidden");
    if (scheduleList) scheduleList.innerHTML = "";
}

// === Сохранение состояния полей ===
document.getElementById("lesson-topic")?.addEventListener("input", e => {
    lessonState.topic = e.target.value;
});
document.getElementById("lesson-location")?.addEventListener("input", e => {
    lessonState.location = e.target.value;
});

window.goToLessonScreen = goToLessonScreen;
window.goToTutorsScreen = goToTutorsScreen;

});

