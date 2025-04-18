document.addEventListener("DOMContentLoaded", function () {
    const scrollUpBtn = document.createElement("div");
    scrollUpBtn.classList.add("scroll-up-btn");
    
    scrollUpBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>`;
    
    document.body.appendChild(scrollUpBtn);

        function updateButtonColor() {
        let scrollTop = window.scrollY;
        let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        let intensity = Math.min(1, scrollTop / maxScroll * 1.5);
        
        scrollUpBtn.style.backgroundColor = `rgba(255, 165, 0, ${intensity})`;
    }

    window.addEventListener("scroll", updateButtonColor);
    updateButtonColor();

    scrollUpBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});
    







// Звезды
document.querySelectorAll(".main4-top3-blocks-stars").forEach(starsContainer => {
    const rating = parseInt(starsContainer.getAttribute("data-rating"));

    for (let i = 1; i <= rating; i++) {
        const star = starsContainer.querySelector(`.main4-top3-blocks-star-${i}`);
        if (star) {
            star.classList.add("filled");
        }
    }
});


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
    setInterval(createCircle, 200);
});
