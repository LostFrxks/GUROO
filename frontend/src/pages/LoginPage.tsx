import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/sign_in.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const animationContainer = document.getElementById("animation-container-login");
    if (!animationContainer) {
      return;
    }

    const maxCircles = 50;

    const createCircle = () => {
      if (document.querySelectorAll(".circle").length >= maxCircles) {
        return;
      }

      const circle = document.createElement("div");
      const size = Math.random() * 80 + 20;
      const speed = Math.random() * 15 + 10;
      const side = Math.floor(Math.random() * 4);
      const fullHeight = document.body.scrollHeight;
      const fullWidth = document.body.scrollWidth;

      let startX = 0;
      let startY = 0;
      let moveX = 0;
      let moveY = 0;

      switch (side) {
        case 0:
          startX = Math.random() * 100;
          startY = -10;
          moveX = (Math.random() - 0.5) * 200;
          moveY = 120;
          break;
        case 1:
          startX = Math.random() * 100;
          startY = (fullHeight / window.innerHeight) * 100 + 10;
          moveX = (Math.random() - 0.5) * 200;
          moveY = -120;
          break;
        case 2:
          startX = -10;
          startY = Math.random() * (fullHeight / window.innerHeight) * 100;
          moveX = 120;
          moveY = (Math.random() - 0.5) * 200;
          break;
        case 3:
          startX = 110;
          startY = Math.random() * (fullHeight / window.innerHeight) * 100;
          moveX = -120;
          moveY = (Math.random() - 0.5) * 200;
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

      circle.addEventListener("click", (event) => {
        event.stopPropagation();
        circle.classList.add("clicked");
      });

      animationContainer.appendChild(circle);

      window.setTimeout(() => {
        const rect = circle.getBoundingClientRect();
        if (
          rect.top > fullHeight ||
          rect.left > fullWidth ||
          rect.bottom < 0 ||
          rect.right < 0
        ) {
          circle.remove();
        }
      }, speed * 1000);
    };

    const intervalId = window.setInterval(createCircle, 400);

    return () => {
      window.clearInterval(intervalId);
      animationContainer.querySelectorAll(".circle").forEach((circle) => circle.remove());
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        _skipSessionHandling: true,
      });

      if (!response.ok) {
        setError("Invalid email or password.");
        return;
      }

      const data = await response.json();
      sessionStorage.setItem("access_token", data.access_token);
      navigate("/tutors");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-login-shell">
        <div id="animation-container-login"></div>
        <Header />
        <div className="wrapper page-login">
          <div className="main1">
            <div className="login-form-container">
              <form id="login-form" className="auth-form" onSubmit={onSubmit}>
              {error && (
                <p style={{ color: "red", fontWeight: "bold", paddingBottom: 10, fontSize: 13 }}>
                  {error}
                </p>
              )}
              <div className="col-md-6">
                <label htmlFor="email" className="login-form-label">
                  Почта
                </label>
                <input
                  type="email"
                  className="login-form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="password" className="login-form-label">
                  Пароль
                </label>
                <input
                  type="password"
                  className="login-form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                className={`btn login-btn-primary${isSubmitting ? " is-loading" : ""}`}
                type="submit"
                id="login-btn"
                disabled={isSubmitting}
              >
                <span className="btn-text">Войти</span>
                <span className="login-loader"></span>
              </button>
              <div className="login-sign-in">
                <h1 className="login-sign-in-text">Нет аккаунта?</h1>
                <a className="login-sign-in-in" href="/register">
                  Зарегистрироваться
                </a>
              </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
