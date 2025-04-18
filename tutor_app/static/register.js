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


function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JS загружен!");

    const emailForm = document.querySelector("#email-form");
    const verifySection = document.querySelector("#verify-section");
    const emailInput = document.querySelector("#email");
    const verifyButton = document.querySelector("#verify-form button");

    // ✅ Создаём блок для вывода ошибок
    const errorMessage = document.createElement("p");
    errorMessage.style.color = "red";
    errorMessage.style.marginTop = "10px";
    emailForm.appendChild(errorMessage);

    if (emailForm) {
        console.log("✅ Форма регистрации найдена!");

        emailForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let emailValue = emailInput.value.trim();
            console.log("📩 Введенный email:", emailValue);

            // 🔥 Быстрая проверка на клиенте
            if (!emailValue) {
                errorMessage.textContent = "❌ Введите почту!";
                return;
            }

            if (!emailValue.endsWith("@auca.kg")) {
                errorMessage.textContent = "❌ Данная почта не поддерживается!";
                return;
            }

            // Если прошло проверку – отправляем запрос
            sendVerificationRequest(emailValue);
        });
    }

    function sendVerificationRequest(emailValue) {
        console.log("⏳ Отправляем запрос на API...");
    
        // ⏩ Сразу показываем сообщение и переходим к следующему шагу
        const btn = document.getElementById("get-code-btn");
        const btnText = btn.querySelector(".btn-text");
        const loader = btn.querySelector(".loader");

        btn.disabled = true;
        btn.classList.add("disabled");
        loader.style.display = "inline-block";
        btnText.textContent = "Отправка...";

        fetch("/send_verification_code/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailValue })
        })
        .then(response => response.json())
        .then(data => {
            console.log("📨 Ответ сервера:", data);
            loader.style.display = "none";
            btnText.textContent = "Получить код";

            if (data.success) {
                errorMessage.style.color = "green";
                errorMessage.textContent = "✅ Код отправлен! Проверьте почту.";

                emailForm.style.display = "none";
                verifySection.style.display = "block";
                verifyButton.setAttribute("data-email", emailValue);
            } else {
                errorMessage.style.color = "red";
                errorMessage.textContent = "❌ " + (data.error || "Ошибка при отправке кода.");
                btn.disabled = false;
                btn.classList.remove("disabled");
            }
        })
        .catch(error => {
            console.error("❌ Ошибка отправки кода:", error);
            loader.style.display = "none";
            btnText.textContent = "Получить код";
            btn.disabled = false;
            btn.classList.remove("disabled");
            errorMessage.style.color = "red";
            errorMessage.textContent = "❌ Ошибка сети! Попробуйте ещё раз.";
        });

    }

    const verifyForm = document.getElementById("verify-form");

    if (verifyForm) {
        verifyForm.addEventListener("submit", function (e) {
            e.preventDefault(); // Не даём браузеру реально отправить форму
    
            const email = verifyButton.getAttribute("data-email");
            const codeInput = document.getElementById("verification-code").value.trim();
    
            // 👇 Валидация произойдёт автоматически, благодаря required
    
            fetch("/verify_code/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, code: codeInput })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = "/register_form/";
                } else {
                    // Доп. сообщение, если код неправильный
                    document.getElementById("verification-code").setCustomValidity("❌ Неверный код");
                    document.getElementById("verification-code").reportValidity();
                }
            });
        });
    
        // 🧼 Убираем ошибку при вводе заново
        document.getElementById("verification-code").addEventListener("input", () => {
            document.getElementById("verification-code").setCustomValidity("");
        });
    }
});
