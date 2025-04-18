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

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector("#login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
        
            const btn = document.getElementById("login-btn");
            const btnText = btn.querySelector(".btn-text");
            const loader = btn.querySelector(".loader");
        
            btn.disabled = true;
            btn.classList.add("disabled");
            loader.style.display = "inline-block";
            btnText.textContent = "Входим...";
        
            let formData = new FormData(loginForm);
        
            fetch("/sign_in/", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("✅ Вход выполнен! Перенаправление...");
                    window.location.href = data.redirect_url;
                } else {
                    alert("❌ Ошибка: " + data.error);
                    loader.style.display = "none";
                    btnText.textContent = "Войти";
                    btn.disabled = false;
                    btn.classList.remove("disabled");
                }
            })
            .catch(error => {
                console.error("❌ Ошибка входа:", error);
                loader.style.display = "none";
                btnText.textContent = "Войти";
                btn.disabled = false;
                btn.classList.remove("disabled");
            });
        });
    }
});
