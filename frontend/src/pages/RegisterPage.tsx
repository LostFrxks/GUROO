import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/register.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const animationContainer = document.getElementById("animation-container-register");
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

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSending(true);

    try {
      const response = await apiFetch("/api/v1/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Unable to send verification code.");
        return;
      }
      setStep("code");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      const response = await apiFetch("/api/v1/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        setError("Invalid verification code.");
        return;
      }

      sessionStorage.setItem("verified_email", email);
      navigate("/register-form");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className="page-register-shell">
        <div id="animation-container-register"></div>
        <Header />
        <div className="wrapper page-register">
          <div className="main1">
            <div className="form-container">
            {step === "email" && (
              <form id="email-form" onSubmit={sendCode}>
                {error && (
                  <p
                    style={{ color: "red", fontWeight: "bold", paddingBottom: 10, fontSize: 13 }}
                  >
                    {error}
                  </p>
                )}
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">
                    Почта
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 mt-3">
                  <button
                    className={`btn btn-primary${isSending ? " is-loading" : ""}`}
                    type="submit"
                    id="get-code-btn"
                    disabled={isSending}
                  >
                    <span className="btn-text">Получить код</span>
                    <span className="loader"></span>
                  </button>
                </div>
              </form>
            )}

            {step === "code" && (
              <div id="verify-section">
                <form id="verify-form" onSubmit={verifyCode}>
                  {error && (
                    <p
                      style={{
                        color: "red",
                        fontWeight: "bold",
                        paddingBottom: 10,
                        fontSize: 13,
                      }}
                    >
                      {error}
                    </p>
                  )}
                  <div className="col-md-6">
                  <label htmlFor="verification-code" className="form-label">
                      Код подтверждения
                  </label>
                    <input
                      type="text"
                      className="form-control"
                      id="verification-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 mt-3">
                    <button
                      className={`btn btn-primary${isVerifying ? " is-loading" : ""}`}
                      type="submit"
                      disabled={isVerifying}
                    >
                      Подтвердить
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="sign-in">
              <h1 className="sign-in-text">Уже есть аккаунт?</h1>
              <a className="sign-in-in" href="/login">
                Войти
              </a>
            </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
