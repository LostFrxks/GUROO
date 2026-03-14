import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/legacy/main.css";

export default function MainPage() {
  useEffect(() => {
    const button = document.getElementById("scroll-up-btn");
    if (!button) {
      return;
    }

    const updateButtonColor = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const intensity = Math.min(1, (scrollTop / Math.max(1, maxScroll)) * 1.5);
      button.style.backgroundColor = `rgba(255, 165, 0, ${intensity})`;
    };

    const onClick = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("scroll", updateButtonColor);
    button.addEventListener("click", onClick);
    updateButtonColor();

    return () => {
      window.removeEventListener("scroll", updateButtonColor);
      button.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    document.querySelectorAll(".main4-top3-blocks-stars").forEach((starsContainer) => {
      const rating = Number(starsContainer.getAttribute("data-rating") ?? 0);
      for (let index = 1; index <= rating; index += 1) {
        const star = starsContainer.querySelector(`.main4-top3-blocks-star-${index}`);
        if (star) {
          star.classList.add("filled");
        }
      }
    });
  }, []);

  return (
    <>
      <Header />
      <div className="scroll-up-btn" id="scroll-up-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </div>
      <div className="wrapper page-home">
        <div className="page-blobs main-blobs" aria-hidden="true">
          <span className="page-blob main-blob-1"></span>
          <span className="page-blob main-blob-2"></span>
          <span className="page-blob main-blob-3"></span>
          <span className="page-blob main-blob-4"></span>
        </div>
        <div className="main1">
          <div className="main1-left">
            <h1 className="main1-text-first">Tutors are always available</h1>
            <h5 className="main1-text-second">
              Тьюторы помогают студентам осваивать сложные темы, предоставляя
              индивидуальную поддержку и готовы помочь изучить новую тему.
            </h5>

            <div className="main1-count">
              <div className="main1-sectors">
                <h1 className="main1-secorts-digit">30+</h1>
                <h3 className="main1-secorts-text">Тьюторов</h3>
              </div>
              <div className="main1-sectors">
                <h1 className="main1-secorts-digit">1000+</h1>
                <h3 className="main1-secorts-text">Cтудентов доверяют нам</h3>
              </div>
              <div className="main1-sectors">
                <h1 className="main1-secorts-digit">100+</h1>
                <h3 className="main1-secorts-text">Успех студентов</h3>
              </div>
            </div>

            <div className="main1-search">
              <div className="main1-search-left">
                <div className="main1-search-img"></div>
                <input
                  type="text"
                  className="main1-search-input"
                  placeholder="Найти тьютора"
                />
              </div>
              <button className="main1-search-button" type="button">
                Поиск
              </button>
            </div>
          </div>

          <div className="main1-right"></div>
        </div>

        <div className="main2">
          <div className="main2-left-back"></div>
          <div className="main2-left"></div>

          <div className="main2-right">
            <h5 className="main2-right-text1">О САЙТЕ</h5>
            <h2 className="main2-right-text2">Простая и удобная запись к тьюторам</h2>
            <h4 className="main2-right-text3">
              С Guroo студенты могут легко находить и бронировать консультации онлайн,
              а тьюторы — управлять расписанием и хранить отчеты в одном месте.
            </h4>
            <button className="main2-right-button" type="button">
              Попробовать Guroo
            </button>
          </div>
        </div>

        <div className="main3">
          <div className="main3-left">
            <h3 className="main3-left-text1">ТЬЮТОРЫ</h3>
            <h3 className="main3-left-text2">Зачем нужно тьюторство?</h3>

            <div className="main3-left-keys">
              <div className="main3-left-keys-keys1">
                <div className="main3-left-keys-keys1-img"></div>
                <h3 className="main3-left-keys-keys1-text">
                  Гибкий график – тьюторы подстраиваются под твои возможности,
                  помогая учиться в удобное время и темпе.
                </h3>
              </div>

              <div className="main3-left-keys-keys1">
                <div className="main3-left-keys-keys1-img"></div>
                <h3 className="main3-left-keys-keys1-text">
                  Опыт старшекурсников – тьюторы уже прошли этот путь, знают
                  тонкости предметов и делятся реальными знаниями.
                </h3>
              </div>

              <div className="main3-left-keys-keys1">
                <div className="main3-left-keys-keys1-img"></div>
                <h3 className="main3-left-keys-keys1-text">
                  Поддержка и мотивация – тьюторы помогают преодолевать сложности
                  и уверенно двигаться к успеху.
                </h3>
              </div>
            </div>
          </div>

          <div className="main3-right-back"></div>
          <div className="main3-right"></div>
        </div>

        <div className="main4">
          <h1 className="main4-text1">ТЬЮТОРЫ</h1>
          <h1 className="main4-text2">Лучшие тьюторы</h1>
          <h1 className="main4-text3">Лучшие тьюторы по результатам рейтинга</h1>

          <div className="main4-top3">
            <div className="main4-top3-blocks">
              <div className="main4-top3-blocks-img1"></div>
              <div className="main4-top3-blocks-cont">
                <h1 className="main4-top3-blocks-text1">Эмирлан Тоголоков</h1>
                <h1 className="main4-top3-blocks-text2">Математика</h1>
                <div className="main4-top3-blocks-course">
                  <div className="main4-top3-blocks-course-img"></div>
                  <h1 className="main4-top3-blocks-course-courses">1 курс</h1>
                </div>

                <div className="main4-top3-blocks-stars" data-rating="4">
                  <div className="main4-top3-blocks-star-1"></div>
                  <div className="main4-top3-blocks-star-2"></div>
                  <div className="main4-top3-blocks-star-3"></div>
                  <div className="main4-top3-blocks-star-4"></div>
                  <div className="main4-top3-blocks-star-5"></div>
                  <h1 className="main4-top3-blocks-count">4.8 / 5.0</h1>
                </div>
              </div>
            </div>
            <div className="main4-top3-blocks">
              <div className="main4-top3-blocks-img2"></div>
              <div className="main4-top3-blocks-cont">
                <h1 className="main4-top3-blocks-text1">Абдималиков Нурсултан</h1>
                <h1 className="main4-top3-blocks-text2">Информатика</h1>
                <div className="main4-top3-blocks-course">
                  <div className="main4-top3-blocks-course-img"></div>
                  <h1 className="main4-top3-blocks-course-courses">3 курс</h1>
                </div>

                <div className="main4-top3-blocks-stars" data-rating="5">
                  <div className="main4-top3-blocks-star-1"></div>
                  <div className="main4-top3-blocks-star-2"></div>
                  <div className="main4-top3-blocks-star-3"></div>
                  <div className="main4-top3-blocks-star-4"></div>
                  <div className="main4-top3-blocks-star-5"></div>
                  <h1 className="main4-top3-blocks-count">5.0 / 5.0</h1>
                </div>
              </div>
            </div>
            <div className="main4-top3-blocks">
              <div className="main4-top3-blocks-img3"></div>
              <div className="main4-top3-blocks-cont">
                <h1 className="main4-top3-blocks-text1">Эмирлан Мурынбаев</h1>
                <h1 className="main4-top3-blocks-text2">Физика</h1>

                <div className="main4-top3-blocks-course">
                  <div className="main4-top3-blocks-course-img"></div>
                  <h1 className="main4-top3-blocks-course-courses">2 курс</h1>
                </div>

                <div className="main4-top3-blocks-stars" data-rating="4">
                  <div className="main4-top3-blocks-star-1"></div>
                  <div className="main4-top3-blocks-star-2"></div>
                  <div className="main4-top3-blocks-star-3"></div>
                  <div className="main4-top3-blocks-star-4"></div>
                  <div className="main4-top3-blocks-star-5"></div>
                  <h1 className="main4-top3-blocks-count">4.7 / 5.0</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="main5">
          <div className="main5-left">
            <div className="main5-quote-wrapper">
              <h1 className="main5-left-quote">
                “Не нужно очаровываться, чтобы не разочаровываться!”
              </h1>
              <p className="quote-author">© Чынгыз Болотбекович</p>
            </div>
          </div>

          <div className="main5-right">
            <div className="main5-right-img"></div>
            <div className="main5-right-circle"></div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
