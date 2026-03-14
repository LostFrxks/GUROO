import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/tutors.css";

type TutorListItem = {
  id: number;
  user_id: number;
  name: string;
  subject?: string | null;
  bio?: string | null;
  course?: number | null;
  group?: string | null;
  photo_path?: string | null;
  photo_paths?: string[];
  schedule?: Record<string, string[]>;
  request_status?: string | null;
  cooldown_until?: string | null;
};

const lessonTimes: Record<string, string> = {
  "1": "08:00 - 09:20",
  "2": "09:30 - 10:50",
  "3": "11:40 - 13:00",
  "4": "13:10 - 14:30",
  "5": "14:40 - 16:00",
  "6": "16:10 - 17:30",
  "7": "17:40 - 19:00",
};

const daysOrder = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export default function TutorsPage() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<TutorListItem[]>([]);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const isAuthenticated = Boolean(sessionStorage.getItem("access_token"));
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [activeTutor, setActiveTutor] = useState<TutorListItem | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const loadTutors = async () => {
      if (!isAuthenticated) {
        setShowAuthPopup(true);
        setIsLoading(false);
        setTutors([]);
        return;
      }

      const meResponse = await apiFetch("/api/v1/auth/me");
      if (meResponse.ok) {
        const me = await meResponse.json();
        if (typeof me?.id === "number") {
          setCurrentUserId(me.id);
        }
      }

      setIsLoading(true);
      try {
        const response = await apiFetch("/api/v1/tutors");
        if (!response.ok) {
          setError("Unable to load tutors.");
          return;
        }
        const data = await response.json();
        setTutors(data);
        setShowAuthPopup(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadTutors();
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const subjectOptions = useMemo(() => {
    const filtered = tutors.filter((tutor) => {
      if (selectedCourse !== "all" && String(tutor.course ?? "") !== selectedCourse) {
        return false;
      }
      return Boolean(tutor.subject);
    });
    const unique = Array.from(new Set(filtered.map((tutor) => tutor.subject!).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b, "ru"));
  }, [tutors, selectedCourse]);

  const filteredTutors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tutors.filter((tutor) => {
      if (term && !tutor.name.toLowerCase().includes(term)) {
        return false;
      }
      if (selectedCourse !== "all" && String(tutor.course ?? "") !== selectedCourse) {
        return false;
      }
      if (selectedSubject && tutor.subject !== selectedSubject) {
        return false;
      }
      return true;
    });
  }, [search, tutors, selectedCourse, selectedSubject]);

  const formatSchedule = (schedule: Record<string, string[]> | any[] | undefined) => {
    if (!schedule || (Array.isArray(schedule) && schedule.length === 0)) {
      return ["Нет доступных слотов"];
    }
    const items: { day: string; time: string; order: number; location?: string }[] = [];
    if (Array.isArray(schedule)) {
      schedule.forEach((entry) => {
        const day = String(entry.day || "");
        const pair = String(entry.pair || "");
        if (!day || !pair) return;
        items.push({
          day,
          time: lessonTimes[String(pair)] || String(pair),
          order: daysOrder.indexOf(day),
          location: entry.location ? String(entry.location) : undefined,
        });
      });
    } else {
      Object.entries(schedule).forEach(([day, pairs]) => {
        const pairList = Array.isArray(pairs) ? pairs : [pairs as unknown as string];
        pairList.forEach((pair) => {
          items.push({
            day,
            time: lessonTimes[String(pair)] || String(pair),
            order: daysOrder.indexOf(day),
          });
        });
      });
    }
    return items
      .sort((a, b) => {
        if (a.order === b.order) return a.time.localeCompare(b.time);
        return a.order - b.order;
      })
      .map((entry) => {
        if (entry.location) {
          return `${entry.day}: ${entry.time} (${entry.location})`;
        }
        return `${entry.day}: ${entry.time}`;
      });
  };

  const onRequest = async (tutorId: number) => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }
    const selfTutor = tutors.find((item) => item.id === tutorId);
    if (selfTutor && currentUserId && selfTutor.user_id === currentUserId) {
      setError("Это ваш профиль. Нельзя записаться к себе.");
      return;
    }
    setError("");
    setRequestingId(tutorId);
    const response = await apiFetch("/api/v1/tutors/request", {
      method: "POST",
      body: JSON.stringify({ tutor_id: tutorId }),
    });
    if (response.ok) {
      const data = await response.json();
      const status =
        data?.status === "cooldown"
          ? "cooldown"
          : data?.status === "already_confirmed"
            ? "confirmed"
            : "pending";
      const cooldownUntil = data?.cooldown_until ?? null;
      setTutors((prev) =>
        prev.map((item) =>
          item.id === tutorId
            ? {
                ...item,
                request_status: status,
                cooldown_until: cooldownUntil ?? item.cooldown_until ?? null,
              }
            : item,
        ),
      );
      setActiveTutor((prev) =>
        prev && prev.id === tutorId
          ? {
              ...prev,
              request_status: status,
              cooldown_until: cooldownUntil ?? prev.cooldown_until ?? null,
            }
          : prev,
      );
    } else if (response.status === 403) {
      setError("Только тьюти или тьюторы могут отправлять заявки на тьютора.");
    } else {
      try {
        const data = await response.json();
        setError(data.detail || "Не удалось отправить заявку.");
      } catch {
        setError("Не удалось отправить заявку.");
      }
    }
    setRequestingId(null);
  };

  const openTutorPopup = (tutor: TutorListItem) => {
    setActiveTutor(tutor);
    setActivePhotoIndex(0);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    document.body.style.overflow = "hidden";
  };

  const closeTutorPopup = () => {
    setActiveTutor(null);
    dragOffsetRef.current = 0;
    document.body.style.overflow = "";
  };

  const tutorPhotos = useMemo(() => {
    if (!activeTutor) return [];
    const sources = [
      ...(activeTutor.photo_paths ?? []),
      activeTutor.photo_path ?? "",
    ].filter((item) => Boolean(item));
    const unique = Array.from(new Set(sources));
    if (unique.length === 0) {
      return ["/Photos/no_background.png"];
    }
    return unique;
  }, [activeTutor]);

  const getCooldownLabel = (cooldownUntil?: string | null) => {
    if (!cooldownUntil) return "";
    const until = new Date(cooldownUntil).getTime();
    const diff = until - nowTick;
    if (diff <= 0) return "Можно отправить снова";
    const totalMinutes = Math.ceil(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `Попробуйте через: ${hours}ч ${minutes}м`;
  };

  useEffect(() => {
    if (tutorPhotos.length === 0) return;
    if (activePhotoIndex > tutorPhotos.length - 1) {
      setActivePhotoIndex(0);
    }
  }, [tutorPhotos, activePhotoIndex]);

  const handleSliderPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = event.clientX;
    setIsDragging(true);
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSliderPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    const delta = event.clientX - dragStartRef.current;
    dragOffsetRef.current = delta;
    setDragOffset(delta);
  };

  const handleSliderPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    const delta = dragOffsetRef.current;
    const threshold = 50;
    if (delta < -threshold && activePhotoIndex < tutorPhotos.length - 1) {
      setActivePhotoIndex((prev) => prev + 1);
    } else if (delta > threshold && activePhotoIndex > 0) {
      setActivePhotoIndex((prev) => prev - 1);
    }
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <>
      <Header />
      <div className="wrapper page-tutors">
        <div className="tutors-hero">
          <div className="tutors-hero-left">
            <h1 className="tutors-hero-title">Список тьюторов</h1>
            <p className="tutors-hero-subtitle">
              Найдите подходящего тьютора по предмету и удобному времени. Запись идет
              через подтверждение тьютора.
            </p>
            <div className="tutors-search">
              <div className="tutors-search-left">
                <div className="tutors-search-img"></div>
                <input
                  type="text"
                  className="tutors-search-input"
                  placeholder="Найти тьютора"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button
                className="tutors-search-button"
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                Фильтр
              </button>
            </div>
            <div className={`filter-container ${showFilters ? "active" : ""}`}>
              <div className="course-buttons">
                {(["all", "1", "2", "3"] as const).map((course) => (
                  <button
                    key={course}
                    type="button"
                    className={`course-btn ${selectedCourse === course ? "active" : ""}`}
                    onClick={() => {
                      setSelectedCourse(course);
                      setSelectedSubject("");
                    }}
                  >
                    {course === "all" ? "Все курсы" : `${course} курс`}
                  </button>
                ))}
                <button
                  type="button"
                  className="reset-filter-btn"
                  onClick={() => {
                    setSelectedCourse("all");
                    setSelectedSubject("");
                    setSearch("");
                  }}
                >
                  Сбросить
                </button>
              </div>
              <div className="subjects-buttons">
                {subjectOptions.length === 0 && (
                  <div className="subject-empty">Выберите курс, чтобы увидеть предметы</div>
                )}
                {subjectOptions.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    className={`subject-btn ${selectedSubject === subject ? "active" : ""}`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="tutors-hero-card">
            <div className="tutors-hero-card-title">Как это работает</div>
            <ul className="tutors-hero-list">
              <li>Запрос → подтверждение тьютора</li>
              <li>Подтверждение студента накануне</li>
              <li>Лимит 2 урока в неделю</li>
            </ul>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="container">
          <div className="blocks">
            {(isLoading || (!isAuthenticated && tutors.length === 0)) &&
              Array.from({ length: 6 }).map((_, index) => (
                <div className="block skeleton-card" key={`skeleton-${index}`}>
                  <div className="gradient-header skeleton-media"></div>
                  <div className="content">
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-chip"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line skeleton-button"></div>
                  </div>
                </div>
              ))}

            {!isLoading &&
              filteredTutors.map((tutor, index) => {
                const gradientClass = index % 2 === 0 ? "gradient-normal" : "gradient-reverse";
                const photo =
                  (tutor.photo_paths && tutor.photo_paths[0]) ||
                  (tutor.photo_path && tutor.photo_path.length > 0 ? tutor.photo_path : "") ||
                  "/Photos/no_background.png";
                const scheduleLines = formatSchedule(tutor.schedule);
                return (
                  <div className="block" key={tutor.id}>
                    <div className={`gradient-header ${gradientClass}`}>
                      <img src={photo} alt={tutor.name} />
                    </div>
                    <div className="content">
                      <h3>{tutor.name}</h3>
                      <span className="grade">{tutor.subject ?? "Предмет не указан"}</span>
                      <p>
                        <strong>📘 Расписание:</strong>
                      </p>
                      <ul>
                        {scheduleLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      <div className="action">
                        <button
                          className={`btn-view ${
                            tutor.request_status === "cooldown" ? "btn-muted" : ""
                          }`}
                          type="button"
                          onClick={() => openTutorPopup(tutor)}
                          disabled={
                            tutor.request_status === "pending" ||
                            tutor.request_status === "cooldown" ||
                            requestingId === tutor.id
                          }
                        >
                          {tutor.request_status === "pending"
                            ? "Ожидает подтверждения"
                            : tutor.request_status === "cooldown"
                              ? getCooldownLabel(tutor.cooldown_until)
                              : "Ознакомиться"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {showAuthPopup && !isAuthenticated && (
          <div className="auth-modal-overlay" role="dialog" aria-modal="true">
            <div className="auth-modal">
              <h2 className="auth-modal-title">Нужно войти</h2>
              <p className="auth-modal-text">
                Чтобы увидеть список тьюторов и отправлять заявки, сначала войдите в аккаунт.
              </p>
              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="auth-modal-btn primary"
                  onClick={() => navigate("/login")}
                >
                  Войти
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTutor && (
          <>
            <div className="popup1-overlay" onClick={closeTutorPopup}></div>
            <div className="popup1 visible" role="dialog" aria-modal="true">
              <button className="popup1-close" onClick={closeTutorPopup}>
                &times;
              </button>
              <div className="popup1-hero">
                <div
                  className="popup1-slider"
                  role="presentation"
                  onPointerDown={handleSliderPointerDown}
                  onPointerMove={handleSliderPointerMove}
                  onPointerUp={handleSliderPointerEnd}
                  onPointerCancel={handleSliderPointerEnd}
                >
                  <div
                    className="popup1-slide-track"
                    style={{
                      transform: `translateX(calc(${-activePhotoIndex * 100}% + ${dragOffset}px))`,
                      transition: isDragging ? "none" : "transform 0.4s ease",
                    }}
                  >
                    {tutorPhotos.map((src, index) => (
                      <div className="popup1-slide" key={`${src}-${index}`}>
                        <img src={src} alt={activeTutor.name} draggable={false} />
                      </div>
                    ))}
                  </div>
                  <div className="popup1-dots">
                    {tutorPhotos.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        type="button"
                        className={`popup1-dot ${index === activePhotoIndex ? "active" : ""}`}
                        onClick={() => setActivePhotoIndex(index)}
                      />
                    ))}
                  </div>
                </div>
                <div className="popup1-hero-info">
                  <h2 className="popup1-name">{activeTutor.name}</h2>
                  <div className="popup1-meta">
                    <span className="popup1-badge">{activeTutor.course ?? "-"} курс</span>
                    <span className="popup1-badge">{activeTutor.group ?? "-"}</span>
                  </div>
                  <p className="popup1-subject-line">{activeTutor.subject ?? "Предмет не указан"}</p>
                </div>
              </div>

              <div className="popup1-body">
                <div className="popup1-grid">
                  <div className="popup1-card">
                    <div className="popup1-card-title">Контакты</div>
                    {activeTutor.request_status === "confirmed" ? (
                      <>
                        <div className="popup1-card-row">
                          <span>Телефон</span>
                          <strong>{activeTutor.phone ?? "-"}</strong>
                        </div>
                        <a
                          href={activeTutor.telegram ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="popup1-telegram-link"
                        >
                          Перейти в телеграм-группу
                        </a>
                      </>
                    ) : (
                      <p className="popup1-bio-text">
                        Контакты доступны после подтверждения заявки.
                      </p>
                    )}
                  </div>
                  <div className="popup1-card">
                    <div className="popup1-card-title">Биография</div>
                    <p className="popup1-bio-text">{activeTutor.bio ?? "Не заполнено"}</p>
                  </div>
                  <div className="popup1-card popup1-card-full">
                    <div className="popup1-card-title">Расписание</div>
                    <ul className="popup1-schedule">
                      {formatSchedule(activeTutor.schedule).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {activeTutor.request_status !== "confirmed" && (
                  <button
                    id="popup1-register"
                    className={`btn ${
                      activeTutor.request_status === "pending"
                        ? "btn-success"
                        : activeTutor.request_status === "cooldown"
                          ? "btn-muted"
                          : ""
                    } ${requestingId === activeTutor.id ? "is-loading" : ""}`}
                    type="button"
                    onClick={() => onRequest(activeTutor.id)}
                    disabled={
                      (currentUserId && activeTutor.user_id === currentUserId) ||
                      activeTutor.request_status === "pending" ||
                      activeTutor.request_status === "cooldown" ||
                      requestingId === activeTutor.id
                    }
                  >
                    {currentUserId && activeTutor.user_id === currentUserId
                      ? "Это вы! :)"
                      : activeTutor.request_status === "pending"
                        ? "Заявка отправлена"
                        : activeTutor.request_status === "cooldown"
                          ? getCooldownLabel(activeTutor.cooldown_until)
                          : "Записаться"}
                    <span className="loader" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}      </div>
      <Footer />
    </>
  );
}
