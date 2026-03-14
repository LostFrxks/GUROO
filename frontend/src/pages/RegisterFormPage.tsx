import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/register_form.css";

export default function RegisterFormPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [course, setCourse] = useState("");
  const [group, setGroup] = useState("");
  const [showGroups, setShowGroups] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const groupsByCourse: Record<number, string[]> = {
    1: [
      "DE-1-25",
      "DE-2-25",
      "DE-3-25",
      "ES-1-25",
      "ES-2-25",
      "ES-3-25",
      "VA-1-25",
      "VA-2-25",
      "VA-3-25",
    ],
    2: [
      "DHT-1-24",
      "DHT-2-24",
      "DMDT-1-24",
      "DMDT-2-24",
      "ECOL-1-24",
      "EHI-1-24",
      "EHI-2-24",
      "EHI-3-24",
      "SEST-1-24",
      "SEST-2-24",
      "SFHT-1-24",
    ],
    3: [
      "DHT-1-23",
      "DHT-2-23",
      "DMDT-1-23",
      "ECOL-1-23",
      "EHI-1-23",
      "EHI-2-23",
      "EHI-3-23",
      "SEST-1-23",
      "SEST-2-23",
      "SFHT-1-23",
    ],
  };

  const courseNumber = Number(course || 0);
  const filteredGroups = useMemo(() => {
    if (!courseNumber || !groupsByCourse[courseNumber]) {
      return [];
    }
    const term = group.trim().toLowerCase();
    if (!term) {
      return groupsByCourse[courseNumber];
    }
    return groupsByCourse[courseNumber].filter((item) => item.toLowerCase().includes(term));
  }, [courseNumber, group]);

  useEffect(() => {
    const stored = sessionStorage.getItem("verified_email");
    if (!stored) {
      navigate("/register");
      return;
    }
    setEmail(stored);
  }, [navigate]);

  useEffect(() => {
    const animationContainer = document.getElementById("animation-container-register-form");
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
    setFieldErrors({});
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    const errors: Record<string, string> = {};
    if (!course) {
      errors.course = "Выберите курс.";
    }
    if (!group.trim()) {
      errors.group = "Выберите группу.";
    } else if (courseNumber && groupsByCourse[courseNumber] && !groupsByCourse[courseNumber].includes(group.trim())) {
      errors.group = "Выберите группу из списка.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          group,
          course: course ? Number(course) : null,
          password,
        }),
      });

      if (!response.ok) {
        setError("Unable to complete registration.");
        return;
      }

      const loginResponse = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        _skipSessionHandling: true,
      });
      if (!loginResponse.ok) {
        sessionStorage.removeItem("verified_email");
        navigate("/login");
        return;
      }
      const loginData = await loginResponse.json();
      sessionStorage.setItem("access_token", loginData.access_token);
      sessionStorage.removeItem("verified_email");
      navigate("/tutors");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-register-form-shell">
        <div id="animation-container-register-form"></div>
        <Header />
        <div className="wrapper page-register-form">
          <div className="main1">
            <div className="form-container">
              <form id="register-form" onSubmit={onSubmit}>
              <input type="hidden" id="email" value={email} />
              <div className="col-md-6">
                <label htmlFor="first_name" className="form-label">
                  Имя
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="last_name" className="form-label">
                  Фамилия
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="course" className="form-label">
                  Курс
                </label>
                <select
                  className="form-select"
                  id="course"
                  value={course}
                  onChange={(e) => {
                    setCourse(e.target.value);
                    setGroup("");
                    setShowGroups(false);
                  }}
                  required
                >
                  <option value="" disabled>
                    Выберите курс...
                  </option>
                  <option value="1">1 курс</option>
                  <option value="2">2 курс</option>
                  <option value="3">3 курс</option>
                </select>
                {fieldErrors.course && (
                  <span className="field-error">{fieldErrors.course}</span>
                )}
              </div>
              <div className="form-group group-wrapper">
                <label htmlFor="group-search" className="form-label">
                  Группа
                </label>
                <input
                  type="text"
                  id="group-search"
                  name="group"
                  autoComplete="off"
                  placeholder={course ? "Введите вашу группу" : "Сначала выберите курс"}
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value);
                    setShowGroups(true);
                  }}
                  onFocus={() => setShowGroups(true)}
                  onBlur={() => window.setTimeout(() => setShowGroups(false), 150)}
                  disabled={!course}
                  required
                />
                <div id="group-list" style={{ display: showGroups && filteredGroups.length ? "block" : "none" }}>
                  {filteredGroups.map((item) => (
                    <div
                      key={item}
                      className="group-item"
                      onMouseDown={() => {
                        setGroup(item);
                        setShowGroups(false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {fieldErrors.group && (
                  <span className="field-error">{fieldErrors.group}</span>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="password" className="form-label">
                  Пароль
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="confirm_password" className="form-label">
                  Повторите пароль
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="confirm_password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p style={{ color: "red", fontWeight: "bold", paddingBottom: 10, fontSize: 13 }}>
                  {error}
                </p>
              )}
              <button
                className={`btn btn-primary${isSubmitting ? " is-loading" : ""}`}
                type="submit"
                id="login-btn"
                disabled={isSubmitting}
              >
                <span className="btn-text">Завершить регистрацию</span>
                <span className="loader"></span>
              </button>
              <div className="sign-in">
                <h1 className="sign-in-text">Есть аккаунт?</h1>
                <a className="sign-in-in" href="/login">
                  Войти
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
