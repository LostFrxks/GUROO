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

        switch (side) {
            case 0: startX = Math.random() * 100; startY = -10; moveX = (Math.random() - 0.5) * 100; moveY = 120; break;
            case 1: startX = Math.random() * 100; startY = 110; moveX = (Math.random() - 0.5) * 100; moveY = -120; break;
            case 2: startX = -10; startY = Math.random() * 100; moveX = 120; moveY = (Math.random() - 0.5) * 100; break;
            case 3: startX = 110; startY = Math.random() * 100; moveX = -120; moveY = (Math.random() - 0.5) * 100; break;
        }

        circle.classList.add('circle');
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.left = `${startX}vw`;
        circle.style.top = `${startY}vh`;
        circle.style.setProperty('--move-x', `${moveX}vw`);
        circle.style.setProperty('--move-y', `${moveY}vh`);
        circle.style.animation = `moveCircle ${speed}s linear infinite alternate`;

        animationContainer.appendChild(circle);

        setTimeout(() => {
            if (circle.getBoundingClientRect().top > window.innerHeight ||
                circle.getBoundingClientRect().left > window.innerWidth ||
                circle.getBoundingClientRect().bottom < 0 ||
                circle.getBoundingClientRect().right < 0) {
                circle.remove();
            }
        }, speed * 1000);
    }

    setInterval(createCircle, 400);
});