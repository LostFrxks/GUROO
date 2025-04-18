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

document.getElementById("register-tutor-form").addEventListener("submit", async function(event) {
    event.preventDefault(); // Останавливаем стандартное поведение формы

    // Проверяем наличие токена
    const tokenInput = document.querySelector("[name='token']");
    if (!tokenInput || !tokenInput.value) {
        alert("❌ Ошибка: отсутствует токен регистрации.");
        return;
    }

    const formData = new FormData(this); // Собираем данные формы

    // Проверяем наличие CSRF-токена
    const csrftoken = document.querySelector("[name=csrfmiddlewaretoken]")?.value;
    const btn = this.querySelector("button[type='submit']");
    const btnText = btn.querySelector(".btn-text");
    const loader = btn.querySelector(".loader");

    btn.disabled = true;
    btn.classList.add("disabled");
    loader.style.display = "inline-block";
    btnText.textContent = "Завершаем регистрацию...";
    try {
        const response = await fetch("/complete_tutor_registration/", {
            method: "POST",
            body: formData,
            headers: csrftoken ? { "X-CSRFToken": csrftoken } : {},
            credentials: "include" // Передаём куки сессии
        });

        const result = await response.json();
        if (result.error === "Пользователь с такой почтой уже зарегистрирован как тьютор!") {
            const emailInput = document.querySelector("[name='email']");
            emailInput.setCustomValidity("Эта почта уже используется!");
            emailInput.reportValidity();
        
            btn.disabled = false;
            btn.classList.remove("disabled");
            loader.style.display = "none";
            btnText.textContent = "Зарегистрироваться";
            return;
        }        
        console.log("Ответ от сервера:", result);
        if (result.error === "Invalid or used token") {
            document.getElementById("token-error-overlay").style.display = "block";
            document.getElementById("token-error-popup").style.display = "block";
            return;
        } 
        if (result.success) {
            // ⏩ Перенаправление на страницу тьюторов
            window.location.href = "/tutors/";
            return;
        }

    } catch (error) {
        console.error("Ошибка при отправке запроса:", error);
        alert("⚠ Произошла ошибка! Попробуйте снова.");
    }
});


document.getElementById("close-token-popup").addEventListener("click", function () {
    document.getElementById("token-error-overlay").style.display = "none";
    document.getElementById("token-error-popup").style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.querySelector("[name='email']");
    if (emailInput) {
        emailInput.addEventListener("input", () => {
        emailInput.setCustomValidity("");
        });
    }
    const allGroups = {
        1: ["DE-1-24", "DE-2-24", "DE-3-24", "ES -2-24", "ES -3-24", "ES-1-24", "VA-1-24", "VA-2-24", "VA-3-24"],
        2: ["DHT-1-23", "DHT-2-23", "DMDT-1-23", "ECOL-1-23", "EHI-1-23", "EHI-2-23", "EHI-3-23", "ETSI-1-23",
            "MIX-1-23", "MIX-2-23", "MIX-3-23", "SEST-1-23", "SEST-2-23", "SEST-3-23", "SFHT-1-23"],
        3: ["DHT-1-22", "DHT-2-22", "DMDT-1-22", "ECOL-1-22", "EHI-1-22", "EHI-2-22",
            "SEST-1-22", "SEST-2-22", "SEST-3-22", "SFHT-1-22"]
      };
    
      const courseSelect = document.querySelector("select[name='course']");
      const groupInput = document.getElementById("group-search");
      const groupList = document.getElementById("group-list");
    
      let currentCourse = null;
    
      function renderGroupDropdown(filter = "") {
        groupList.innerHTML = "";
    
        if (!currentCourse || !allGroups[currentCourse]) return;
    
        const filtered = allGroups[currentCourse].filter(group =>
          group.toLowerCase().includes(filter.toLowerCase())
        );
    
        filtered.forEach(group => {
          const div = document.createElement("div");
          div.className = "group-item";
          div.textContent = group;
          div.addEventListener("click", () => {
            groupInput.value = group;
            groupList.style.display = "none";
          });
          groupList.appendChild(div);
        });
    
        groupList.style.display = filtered.length > 0 ? "block" : "none";
      }
    
      courseSelect.addEventListener("change", () => {
        currentCourse = parseInt(courseSelect.value); // 🔥 Преобразуем в число
        groupInput.value = "";  // очищаем поле
        groupList.innerHTML = "";
      });
    
      groupInput.addEventListener("input", () => {
        renderGroupDropdown(groupInput.value);
      });
    
      groupInput.addEventListener("focus", () => {
        renderGroupDropdown(groupInput.value);
      });
    
      document.addEventListener("click", (e) => {
        if (!groupInput.contains(e.target) && !groupList.contains(e.target)) {
          groupList.style.display = "none";
        }
      });
});
