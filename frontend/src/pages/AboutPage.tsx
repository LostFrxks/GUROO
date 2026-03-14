import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/legacy/about.css";

export default function AboutPage() {
  useEffect(() => {
    const slider = document.querySelector<HTMLDivElement>(".slider");
    const slides = document.querySelectorAll<HTMLElement>(".slide");
    const introScreen = document.querySelector<HTMLElement>(".intro-screen");
    const header = document.querySelector<HTMLElement>("header");

    if (!slider || slides.length === 0) {
      return;
    }

    let scrollLocked = true;

    const preventScroll = (event: Event) => {
      if (!scrollLocked) {
        return;
      }
      event.preventDefault();
    };

    const preventKeyScroll = (event: KeyboardEvent) => {
      if (!scrollLocked) {
        return;
      }
      const keys = [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
        "Spacebar",
      ];
      if (keys.includes(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeyScroll, { passive: false });

    let index = 0;
    let slideWidth = slides[0].getBoundingClientRect().width;
    const totalSlides = slides.length;

    const updateSlideWidth = () => {
      slideWidth = slides[0].getBoundingClientRect().width;
      slider.style.transform = `translateX(${-index * slideWidth}px)`;
    };

    const updateSlide = () => {
      slider.style.transition = "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
      slider.style.transform = `translateX(${-index * slideWidth}px)`;
    };

    const nextSlide = () => {
      index = (index + 1) % totalSlides;
      updateSlide();
    };

    updateSlideWidth();
    window.addEventListener("resize", updateSlideWidth);
    const sliderInterval = window.setInterval(nextSlide, 3000);

    const scrollTimer = window.setTimeout(() => {
      if (header) {
        window.scrollTo({
          top: header.offsetTop,
          behavior: "smooth",
        });
      }
    }, 2000);

    const fadeTimer = window.setTimeout(() => {
      introScreen?.classList.add("fade-out");
    }, 2700);

    const hideTimer = window.setTimeout(() => {
      if (introScreen) {
        introScreen.style.display = "none";
      }
      scrollLocked = false;
    }, 3000);

    return () => {
      window.removeEventListener("resize", updateSlideWidth);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeyScroll);
      window.clearInterval(sliderInterval);
      window.clearTimeout(scrollTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="intro-screen">
        <h1 className="intro-text">GFive Team</h1>
      </div>
      <Header />
      <div className="wrapper page-about">
        <div className="about-bg" aria-hidden="true">
          <span className="about-blob about-blob-1"></span>
          <span className="about-blob about-blob-2"></span>
          <span className="about-blob about-blob-3"></span>
          <span className="about-blob about-blob-4"></span>
          <span className="about-blob about-blob-5"></span>
          <span className="about-blob about-blob-6"></span>
        </div>
        <div className="main1-about">
          <div className="slider-container reveal">
            <div className="slider">
              <div className="slide">
                <img src="/Photos/slider-1.jpg" alt="Team member" className="cropped-image" />
                <p className="text-slider">Мурынбаев Эмирлан</p>
              </div>
              <div className="slide">
                <img src="/Photos/slider-2.jpg" alt="Team member" className="cropped-image" />
                <p className="text-slider">Абдималиков Нурсултан</p>
              </div>
              <div className="slide">
                <img src="/Photos/slider-3.jpg" alt="Team member" className="cropped-image" />
                <p className="text-slider">Усенов Артур</p>
              </div>
              <div className="slide">
                <img src="/Photos/slider-4.jpg" alt="Team member" className="cropped-image" />
                <p className="text-slider">Тоголоков Эмирлан</p>
              </div>
              <div className="slide">
                <img src="/Photos/slider-5.jpg" alt="Team member" className="cropped-image" />
                <p className="text-slider">Курсаналиев Арсен</p>
              </div>
            </div>
          </div>

          <div className="main1-right-about reveal">
            <h5 className="main1-right-text1-about">О команде</h5>
            <h2 className="main1-right-text2-about">GFive Team</h2>
            <h4 className="main1-right-text3-about">
              GFive Team - это команда из 5 человек, состоящая из студентов
              направления SEST, колледжа TSI AUCA. В нашу команду входят такие
              ученики как: Тоголоков Эмирлан, Усенов Артур, Мурынбаев Эмирлан,
              Курсаналиев Арсен и Абдималиков Нурсултан. Нашей целью является
              создание надежного и интуитивно понятного решения, которое станет
              неотъемлемой частью учебного процесса в колледже TSI AUCA.
            </h4>
            <div className="about-stats">
              <div className="about-stat">
                <div className="about-stat-number">5</div>
                <div className="about-stat-label">Участников</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-number">3</div>
                <div className="about-stat-label">Проекта</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-number">TSI</div>
                <div className="about-stat-label">AUCA</div>
              </div>
            </div>
          </div>
        </div>

        <div className="inserted-part reveal">
          <h1 className="inserted-part-text">Наши проекты</h1>
        </div>

        <div className="main2-about reveal">
          <div className="main2-left-about about-card">
            <h2 className="main2-left-text1-about">GUROO</h2>
            <h4 className="main2-left-text2-about">
              Guroo — это веб-платформа, созданная для удобной записи студентов
              колледжа TSI AUCA к тьюторам. Данная система создана, которая
              упрощает процесс бронирования консультаций, автоматизирует учет
              встреч и делает взаимодействие между студентами и преподавателями
              более удобным и прозрачным.
            </h4>
          </div>
          <div className="main2-right-about"></div>
        </div>

        <div className="main3-about reveal">
          <div className="main3-left-about"></div>
          <div className="main3-right-about about-card">
            <h2 className="main3-right-about-text1">MAKEATHON</h2>
            <h4 className="main3-right-about-text2">
              Наша команда заняла первое место на Мейкатоне. Нашей индивидуальной
              разработкой была платформа-коляска для инвалидов, созданная на базе
              гироскутера с управлением через Arduino. Это устройство значительно
              улучшает мобильность людей с ограниченными возможностями,
              предоставляя им больше свободы передвижения. Мы гордимся тем, что
              смогли предложить реальное решение, которое сочетает инновационный
              подход и практическую ценность, и получили заслуженное признание на
              конкурсе.
            </h4>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
