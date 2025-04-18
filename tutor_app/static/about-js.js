document.addEventListener("DOMContentLoaded", function () {
    const slides = document.querySelectorAll(".slide");
    const slider = document.querySelector(".slider");
    let index = 0;
    let slideWidth = slides[0].getBoundingClientRect().width; // Получаем ширину слайда
    const totalSlides = slides.length;

    function updateSlideWidth() {
        slideWidth = slides[0].getBoundingClientRect().width; // Обновляем ширину при ресайзе
        slider.style.transform = `translateX(${-index * slideWidth}px)`;
    }

    function cloneSlides() {
        const firstClone = slides[0].cloneNode(true);
        slider.appendChild(firstClone);
    }

    function updateSlide() {
        slider.style.transition = "transform 1s ease-in-out";
        slider.style.transform = `translateX(${-index * slideWidth}px)`;
    }

    function nextSlide() {
        index++;
        updateSlide();

        if (index === totalSlides) {
            setTimeout(() => {
                slider.style.transition = "none";
                index = 0;
                slider.style.transform = `translateX(0px)`;
            }, 1000);
        }
    }

    // Обновляем ширину слайдов при изменении размеров экрана
    window.addEventListener("resize", updateSlideWidth);

    cloneSlides();
    setInterval(nextSlide, 3000);
});


document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        window.scrollTo({
            top: document.querySelector("header").offsetTop,
            behavior: "smooth"
        });
        
    }, 2000); // Было 2000, теперь ждет дольше перед началом скролла

    setTimeout(() => {
        document.querySelector(".intro-screen").classList.add("fade-out");
    }, 2700); // Было 4000, теперь исчезает медленнее

    setTimeout(() => {
        document.querySelector(".intro-screen").style.display = "none";
    }, 3000); // Было 4000, теперь полностью исчезает медленнее
});


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


document.addEventListener("DOMContentLoaded", function () {
    const userIdElement = document.getElementById("user-id");
    const userId = userIdElement ? userIdElement.textContent.trim() : null;

    console.log("📌 Проверка userId перед запросом:", userId);

    if (!userId) {
        console.error("❌ Ошибка: userId отсутствует! Запрос API не будет отправлен.");
        return;
    }

    const url = `/get_registered_tutors/?user_id=${encodeURIComponent(userId)}`;
    console.log("📡 Отправляем запрос:", url);

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            return response.json();
        })
        .then(data => console.log("✅ API Response:", data))
        .catch(error => console.error("❌ Ошибка API:", error));
});

