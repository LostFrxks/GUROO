import { useEffect } from "react";

export default function Footer() {
  useEffect(() => {
    const footerAnimation = document.getElementById("footer-animation");
    if (!footerAnimation) {
      return;
    }

    const maxCircles = 50;
    let bigCircle: HTMLDivElement | null = null;
    let bigCircleTimer = 0;

    const createCircle = () => {
      if (document.querySelectorAll(".circle").length >= maxCircles) {
        return;
      }

      const circle = document.createElement("div");
      const size = Math.random() * 80 + 20;
      const speed = Math.random() * 15 + 10;
      const directionX = Math.random() < 0.5 ? -1 : 1;
      const directionY = Math.random() < 0.5 ? -1 : 1;

      let startX = 0;
      let startY = 0;
      let moveX = 0;
      let moveY = 0;
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
        default:
          break;
      }

      circle.classList.add("circle");
      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.left = `${startX}vw`;
      circle.style.top = `${startY}vh`;
      circle.style.setProperty("--move-x", `${moveX}vw`);
      circle.style.setProperty("--move-y", `${moveY}vh`);
      circle.style.animation = `moveCircle ${speed}s linear infinite alternate`;

      footerAnimation.appendChild(circle);

      window.setTimeout(() => {
        circle.remove();
      }, speed * 1000);
    };

    const createBigCircle = () => {
      if (bigCircle) {
        bigCircle.remove();
      }

      bigCircle = document.createElement("div");
      bigCircle.classList.add("big-circle");

      const size = Math.random() * 200 + 200;
      bigCircle.style.width = `${size}px`;
      bigCircle.style.height = `${size}px`;

      let startX = 0;
      let startY = 0;
      let moveX = 0;
      let moveY = 0;
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
        default:
          break;
      }

      bigCircle.style.left = `${startX}vw`;
      bigCircle.style.top = `${startY}vh`;
      bigCircle.style.animation = "moveBigCircle 25s linear infinite alternate";

      footerAnimation.appendChild(bigCircle);
      bigCircleTimer = window.setTimeout(createBigCircle, 25000);
    };

    createBigCircle();
    const interval = window.setInterval(createCircle, 200);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(bigCircleTimer);
      if (bigCircle) {
        bigCircle.remove();
      }
      footerAnimation.querySelectorAll(".circle").forEach((circle) => circle.remove());
    };
  }, []);

  return (
    <footer>
      <div className="footer-container">
        <div className="footer-left">
          <h1 className="footer-left-title">The Guroo Project</h1>
          <div className="footer-links">
            <a href="#" className="footer-link">
              О проекте
            </a>
            <a href="#" className="footer-link">
              FAQ
            </a>
            <a href="#" className="footer-link">
              Тех. поддержка
            </a>
            <a href="#" className="footer-link">
              Условия использования
            </a>
            <a href="#" className="footer-link">
              Политика конфиденциальности
            </a>
            <a href="https://tsiauca.kg" className="footer-link">
              Официальный сайт TSI AUCA
            </a>
          </div>
        </div>
        <div className="footer-right">
          <h1 className="footer-right-title">Соц. сети</h1>
          <div className="social-icons">
            <div className="social-item">
              <div className="social-icons-img1"></div>
              <a href="#" className="social-icon">
                Telegram
              </a>
            </div>
            <div className="social-item">
              <div className="social-icons-img2"></div>
              <a href="#" className="social-icon">
                Whatsapp
              </a>
            </div>
            <div className="social-item">
              <div className="social-icons-img3"></div>
              <a href="#" className="social-icon">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
      <div id="footer-animation"></div>
    </footer>
  );
}
