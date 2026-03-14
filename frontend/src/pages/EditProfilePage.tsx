import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/edit_profile.css";

type ScheduleEntry = { id: string; day: string; pair: string; location: string };

const daysOfWeek = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const lessonTimes: Record<string, string> = {
  "1": "08:00 - 09:20",
  "2": "09:30 - 10:50",
  "3": "11:40 - 13:00",
  "4": "13:10 - 14:30",
  "5": "14:40 - 16:00",
  "6": "16:00 - 17:20",
  "7": "17:30 - 19:00",
};

const lessonLocations = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
  "C10",
  "C11",
  "LAB1",
  "LAB2",
  "LAB3",
  "Балкон",
  "MR",
  "CH",
];

const subjectsByCourse: Record<string, string[]> = {
  "1": [
    "Кыргысзкая литература (Шамбаева Б.)",
    "Кыргысзкая литература (Карабаев Д.)",
    "Кыргысзкая литература (Мамырбаева Н.)",
    "Civics (Grace Horman)",
    "General English (Григгс Самуэль)",
    "Intro to Computers (Asem Begmanova)",
    "Математика (Амракулов М.)",
    "Математика (Беляева О.)",
    "Математика (Якиманская Т.)",
    "Математика (Рахманова А.)",
    "Астрономия (Койчуманов А.)",
    "Биология (Эсеналиев А.)",
    "Всемирная история искусства (Воронина Е.)",
    "Всеобщая история (Кайназарова М.)",
    "Всеобщая история (Сулье Н.)",
    "География (Джусупова Ч.)",
    "География (Келгенбаева К.)",
    "Иностранный язык (Bethan Holland)",
    "Иностранный язык (Ахунджанова С.)",
    "Иностранный язык (Ричард Хокс)",
    "Иностранный язык (Цуканова Н.)",
    "Иностранный язык (Эссенс Тшума)",
    "Информатика (Сарыбаева А.)",
    "Информатика (Тультемирова Г.)",
    "История Кыргызстана (Кайназарова М.)",
    "Кыргысзкий язык (Карабаев Д.)",
    "Кыргысзкий язык (Мамырбаева Н.)",
    "Кыргысзкий язык (Шамбаева Б.)",
    "Математика (Якиманская Т.)",
    "Начальная военная подготовка (Алиев А.)",
    "Основы креативного и критического мышления (Шабалина А.)",
    "Русская литература (Воронина Е.)",
    "Русский язык (Логвиненко В.)",
    "Физика (Бессонов Ф.)",
    "Физика (Койчуманов А.)",
    "Физика (Тельтаева А.)",
    "Химия (Самакбаев М.)",
  ],
  "2": [
    "3D моделирование (Ермаков О.)",
    "Data Acquisition and Webmapping (Grace Horman)",
    "English Composition 2 (Сартини Майкл)",
    "English Composition 2 (Халмурзаева А.)",
    "Introduction to Cartography and ArcGIS (Grace Horman)",
    "Mathematical Analysis I (Burova Elena)",
    "Алгоритмы и структуры данных (Джумабаев Н.)",
    "Анализ и визуализация данных 2 (Джумагулов К.)",
    "Бизнес-моделирование (Дельфин В.)",
    "Бухгалтерский учет (Галимова О.)",
    "Введение в бухгалтерский учет (Галимова О.)",
    "География Кыргызстана (Джусупова Ч.)",
    "Дизайн-мышление (Султанова Д.)",
    "Зеленая архитектура (Кочмарева Л.)",
    "Инновации: история, логика, тренды (Ибраимов Н.)",
    "Искусство звука и дизайна (Осмонов М.)",
    "Искусство иллюстрации (Путятина О.)",
    "Искусство фотографии и дизайна (Койчубеков Ж.)",
    "История и логика предпринимательства (Уметалиев А.)",
    "История Кыргызстана (Кайназарова М.)",
    "Креативное мышление и интеллект (Мовшук А.)",
    "Лидерство и командная работа (Ушакова Д.)",
    "Макроэкономика (Журсун И.)",
    "Маркетинг (Уметалиев А.)",
    "Математический анализ 1 (Вейс П.)",
    "Международные правила и стандарты (Boizeau P.)",
    "Основы веб-разработки (Ташматов А.)",
    "Основы дизайна (Ва-Ахунов Р.)",
    "Основы машинного обучения (Аталов С.)",
    "Разработка ПО (Тультемиров Г.)",
    "Разработка ПО 2 (Тультемиров Г.)",
    "Стартап-менеджмент (Дельфин В.)",
    "Сценарное мастерство (Шабалина А.)",
    "Управление проектами (Садыкова Ж.)",
    "Цифровая экономика (Ибраимов Н.)",
    "Экологическая экономика (Журсун И.)",
    "Экологические нормы и политика (Иманова С.)",
    "Эмоциональное обучение (Султанова Д.)",
    "Энергоэффективность зданий (Торопов М.)",
  ],
  "3": [
    "FYS 2 (Брюли Ж.)",
    "FYS 2 (Сулье Н.)",
    "Green Spaces in Urban Development (Буразо Ф.)",
    "Анализ и визуализация данных 4 (Бегманова А.)",
    "Анализ и визуализация данных 4 (Каримова Д.)",
    "Анализ и визуализация данных 4 (Кулданбаева М.)",
    "Анализ и визуализация данных 4 (Мырзагулова А.)",
    "Анализ рынков Весна (Кокалюк Е.)",
    "Анимация элементов и создание видео (Толубаев Ж.)",
    "Бизнес-право и налоги (Самсалиева Ч.)",
    "Бизнес-этика и коммуникации (Иманова С.)",
    "Визуализация данных и инфографика (Турдуева Б.)",
    "Визуальное мышление (Путятина О.)",
    "Визуальное повествование (Толубаев Ж.)",
    "Дизайн-антропология (Турдиева Н.)",
    "Информационная безопасность и защита данных (Сарыбаева А.)",
    "Маркетинг (Уметалиев А.)",
    "Математика для бизнеса 2 (Хрущева Р.)",
    "Математика и физика для экологии (Буразо Ф.)",
    "Новое предпринимательство (Уметалиев А.)",
    "Основы кинематографии (Койчубеков Ж.)",
    "Основы системного инжиниринга (Христофориди Д.)",
    "Проектное финансирование и ТЭО (Джусупов А.)",
    "Прототипирование и тестирование (Ва-Ахунов Р.)",
    "Прототипирование и тестирование DMDT (Ва-Ахунов Р.)",
    "Стартап ресурсы: модели и тренды (Дельфин В.)",
    "Структуры данных и управление БД (Ташматов А.)",
    "Технологии обработки и анализа данных (Аталов С.)",
    "Управление отходами (Келгенбаева К.)",
    "Управленческий учет для стартапов (Галимова О.)",
  ],
};

export default function EditProfilePage() {
  const navigate = useNavigate();
  const BIO_MAX = 300;
  const [subject, setSubject] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [selectedAvatarChoice, setSelectedAvatarChoice] = useState<string>("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [activeCropFile, setActiveCropFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropSaving, setIsCropSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubjectListOpen, setIsSubjectListOpen] = useState(false);
  const subjectBoxRef = useRef<HTMLDivElement | null>(null);

  const availableSubjects = useMemo(
    () => (course ? subjectsByCourse[course] || [] : []),
    [course]
  );

  const filteredSubjects = useMemo(() => {
    if (!availableSubjects.length) return [];
    const query = subject.trim().toLowerCase();
    if (!query) return availableSubjects;
    return availableSubjects.filter((item) => item.toLowerCase().includes(query));
  }, [availableSubjects, subject]);

  useEffect(() => {
    const loadProfile = async () => {
      const meResponse = await apiFetch("/api/v1/auth/me");
      if (meResponse.ok) {
        const me = await meResponse.json();
        if (me.role !== "tutor") {
          navigate("/", { replace: true });
          return;
        }
      }

      const response = await apiFetch("/api/v1/tutors/me");
      if (!response.ok) {
        setError("Unable to load profile.");
        return;
      }
      const data = await response.json();
      setSubject(data.subject ?? "");
      setBio(data.bio ?? "");
      setTelegram(data.telegram ?? "");
      setPhone(data.phone ?? "");
      setCourse(data.course ? String(data.course) : "");
      const existing = Array.isArray(data.photo_paths)
        ? data.photo_paths
        : data.photo_path
          ? [data.photo_path]
          : [];
      setExistingPhotos(existing);
      if (data.photo_path) {
        setSelectedAvatarChoice(`existing:${data.photo_path}`);
      } else if (existing.length > 0) {
        setSelectedAvatarChoice(`existing:${existing[0]}`);
      }
      const scheduleData = data.schedule ?? {};
      let parsedEntries: ScheduleEntry[] = [];
      if (Array.isArray(scheduleData)) {
        parsedEntries = scheduleData.map((entry: any) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : `${entry.day}-${entry.pair}-${Date.now()}`,
          day: String(entry.day || daysOfWeek[0]),
          pair: String(entry.pair || "1"),
          location: String(entry.location || ""),
        }));
      } else {
        parsedEntries = Object.entries(scheduleData as Record<string, string[]>).flatMap(
          ([day, pairs]) =>
            (pairs || []).map((pair) => ({
              id: crypto.randomUUID ? crypto.randomUUID() : `${day}-${pair}-${Date.now()}`,
              day,
              pair: String(pair),
              location: "",
            })),
        );
      }
      setScheduleEntries(parsedEntries.slice(0, 2));
    };
    loadProfile();
  }, [navigate]);

  useEffect(() => {
    const animationContainer = document.getElementById("animation-container-edit-profile");
    if (!animationContainer) return;

    const maxCircles = 50;
    const createCircle = () => {
      if (document.querySelectorAll(".circle").length >= maxCircles) return;

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

  useEffect(() => {
    if (!activeCropFile && pendingFiles.length > 0) {
      setActiveCropFile(pendingFiles[0]);
      setPendingFiles((prev) => prev.slice(1));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [activeCropFile, pendingFiles]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (subjectBoxRef.current && !subjectBoxRef.current.contains(event.target as Node)) {
        setIsSubjectListOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const getAvailablePairs = (day: string, entryId: string) => {
    const used = new Set(
      scheduleEntries
        .filter((entry) => entry.day === day && entry.id !== entryId)
        .map((entry) => entry.pair)
    );
    return Object.keys(lessonTimes).filter((pair) => !used.has(pair));
  };

  const addScheduleEntry = () => {
    if (scheduleEntries.length >= 2) {
      return;
    }
    setScheduleEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `entry-${Date.now()}`,
        day: daysOfWeek[0],
        pair: "1",
        location: "",
      },
    ]);
  };

  const updateEntry = (
    entryId: string,
    updates: Partial<{ day: string; pair: string; location: string }>,
  ) => {
    setScheduleEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        const nextEntry = { ...entry, ...updates };
        const availablePairs = getAvailablePairs(nextEntry.day, entryId);
        if (!availablePairs.includes(nextEntry.pair)) {
          nextEntry.pair = availablePairs[0] ?? "1";
        }
        return nextEntry;
      })
    );
  };

  const removeEntry = (entryId: string) => {
    setScheduleEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!telegram.trim()) {
      errors.telegram = "Введите ссылку на Telegram-группу.";
    } else if (!telegram.trim().startsWith("https://t.me/")) {
      errors.telegram = "Ссылка должна начинаться с https://t.me/.";
    }
    if (!phone.trim()) {
      errors.phone = "Введите номер телефона.";
    }
    if (!course) {
      errors.course = "Выберите курс.";
    }
    if (!subject.trim()) {
      errors.subject = "Выберите предмет.";
    } else if (availableSubjects.length > 0 && !availableSubjects.includes(subject.trim())) {
      errors.subject = "Выберите предмет из списка.";
    }
    if (!bio.trim()) {
      errors.bio = "Заполните биографию.";
    } else if (bio.length > BIO_MAX) {
      errors.bio = `Биография должна быть не длиннее ${BIO_MAX} символов.`;
    }
    if (scheduleEntries.length === 0) {
      errors.schedule = "Добавьте хотя бы один день и пару.";
    } else {
      const seen = new Set<string>();
      scheduleEntries.forEach((entry) => {
        const key = `${entry.day}-${entry.pair}`;
        if (seen.has(key)) {
          errors.schedule = "Этот временной слот уже выбран.";
        }
        seen.add(key);
        const locationValue = entry.location.trim();
        if (!locationValue || !lessonLocations.includes(locationValue)) {
          errors.schedule =
            "Выберите место из списка (C1-C11, LAB1-LAB3, Балкон).";
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const parsedSchedule = scheduleEntries.map((entry) => ({
      day: entry.day,
      pair: entry.pair,
      location: entry.location.trim(),
    }));

    const response = await apiFetch("/api/v1/tutors/me", {
      method: "PUT",
      body: JSON.stringify({
        profile: {
          subject,
          bio,
          telegram,
          phone,
          course: course ? Number(course) : null,
          photo_path: selectedAvatarChoice.startsWith("existing:")
            ? selectedAvatarChoice.replace("existing:", "")
            : null,
          schedule: parsedSchedule,
        },
      }),
    });

    if (!response.ok) {
      try {
        const data = await response.json();
        if (data?.detail) {
          setError(Array.isArray(data.detail) ? "Биография слишком длинная." : data.detail);
        } else {
          setError("Unable to save profile.");
        }
      } catch {
        setError("Unable to save profile.");
      }
      return;
    }

    setMessage("Анкета успешно сохранена.");
    setTimeout(() => {
      navigate("/tutors");
    }, 900);
  };

  return (
    <div className="page-edit-profile-shell">
      <div id="animation-container-edit-profile"></div>
      <Header />
      <div className="wrapper page-edit-profile">
        <div className="main1">
          <div className="profile-edit-container">
            <h2>Редактирование анкеты</h2>
    {message && <div className="profile-save-toast">{message}</div>}
    {error && <p className="form-error">{error}</p>}
            <form className="profile-form" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="telegram">Телеграмм группа:</label>
                <input
                  id="telegram"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/+123"
                  required
                />
                {fieldErrors.telegram && <span className="field-error">{fieldErrors.telegram}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Номер телефона:</label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0555 555 555"
                  required
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="course" className="form-label">
                  Курс:
                </label>
                <select
                  id="course"
                  className="form-select"
                  value={course}
                  onChange={(e) => {
                    setCourse(e.target.value);
                    setSubject("");
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
                {fieldErrors.course && <span className="field-error">{fieldErrors.course}</span>}
              </div>

              <div className="form-group" ref={subjectBoxRef}>
                <label htmlFor="subject">Предмет:</label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setIsSubjectListOpen(true);
                  }}
                  onFocus={() => setIsSubjectListOpen(true)}
                  required
                  autoComplete="off"
                />
                {isSubjectListOpen && filteredSubjects.length > 0 && (
                  <ul className="dropdown-list">
                    {filteredSubjects.map((item) => (
                      <li
                        key={item}
                        onClick={() => {
                          setSubject(item);
                          setIsSubjectListOpen(false);
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {fieldErrors.subject && <span className="field-error">{fieldErrors.subject}</span>}
              </div>

              <div className="form-group">
                <label>Выберите дни недели:</label>
                <div id="days-container">
                  {scheduleEntries.map((entry) => {
                    const pairOptions = getAvailablePairs(entry.day, entry.id);
                    return (
                      <div className="day-entry" key={entry.id}>
                        <select
                          value={entry.day}
                          onChange={(e) => updateEntry(entry.id, { day: e.target.value })}
                          required
                        >
                          {daysOfWeek.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <select
                          value={entry.pair}
                          onChange={(e) => updateEntry(entry.id, { pair: e.target.value })}
                          required
                        >
                          {pairOptions.map((pair) => (
                            <option key={pair} value={pair}>
                              Пара {pair}
                            </option>
                          ))}
                        </select>
                        <select
                          className="lesson-location"
                          value={entry.location}
                          onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                          required
                        >
                          <option value="" disabled>
                            Место
                          </option>
                          {lessonLocations.map((place) => (
                            <option key={place} value={place}>
                              {place}
                            </option>
                          ))}
                        </select>
                        <span className="time-display">{lessonTimes[entry.pair]}</span>
                        <button
                          type="button"
                          className="delete-day"
                          onClick={() => removeEntry(entry.id)}
                        ></button>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  id="add-day-btn"
                  onClick={addScheduleEntry}
                  disabled={scheduleEntries.length >= 2}
                >
                  Добавить день
                </button>
                {fieldErrors.schedule && (
                  <span className="field-error">{fieldErrors.schedule}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bio">Биография:</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Напишите о себе"
                  rows={4}
                  maxLength={BIO_MAX}
                  required
                />
                <div className="field-hint">{bio.length}/{BIO_MAX}</div>
                {fieldErrors.bio && <span className="field-error">{fieldErrors.bio}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="photos">Фотографии (до 3):</label>
                <div className="file-upload">
                  <label className="file-upload-btn" htmlFor="photos">
                    Выбрать файлы
                  </label>
                  <input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const incoming = Array.from(event.target.files ?? []);
                      const maxAdd = Math.max(
                        0,
                        3 - existingPhotos.length - pendingFiles.length - (activeCropFile ? 1 : 0)
                      );
                      const slice = incoming.slice(0, maxAdd);
                      if (slice.length === 0) {
                        return;
                      }
                      setPendingFiles((prev) => [...prev, ...slice]);
                    }}
                  />
                  {pendingFiles.length > 0 && (
                    <span className="file-upload-count">Очередь: {pendingFiles.length}</span>
                  )}
                </div>
                {existingPhotos.length > 0 && (
                  <div className="photo-grid">
                    {existingPhotos.map((path) => (
                      <label className="photo-card" key={path}>
                        <input
                          type="radio"
                          name="avatar-choice"
                          className="photo-select"
                          checked={selectedAvatarChoice === `existing:${path}`}
                          onChange={() => setSelectedAvatarChoice(`existing:${path}`)}
                        />
                        <img src={path} alt="profile" />
                        <span className="photo-badge">Аватар</span>
                        <button
                          type="button"
                          className="photo-remove"
                          onClick={async (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const token = sessionStorage.getItem("access_token");
                            const response = await fetch("/api/v1/tutors/me/photos", {
                              method: "DELETE",
                              headers: token
                                ? {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  }
                                : { "Content-Type": "application/json" },
                              body: JSON.stringify({ path }),
                              credentials: "include",
                            });
                            if (response.ok) {
                              const data = await response.json();
                              if (Array.isArray(data.photo_paths)) {
                                setExistingPhotos(data.photo_paths);
                                const next = data.photo_path || data.photo_paths[0] || "";
                                setSelectedAvatarChoice(next ? `existing:${next}` : "");
                              }
                            }
                          }}
                          aria-label="Удалить фото"
                        >
                          ×
                        </button>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="save-btn">
                Сохранить
              </button>
            </form>
          </div>
        </div>
      </div>
      {activeCropFile && (
        <div className="cropper-overlay">
          <div className="cropper-modal">
            <div className="cropper-header">
              <h3>Обрезка фото</h3>
              <p>Подвинь фото и выбери центр аватара</p>
            </div>
            <div className="cropper-area">
              <Cropper
                image={URL.createObjectURL(activeCropFile)}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>
            <div className="cropper-controls">
              <label className="cropper-zoom">
                Масштаб
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </label>
              <div className="cropper-actions">
                <button
                  type="button"
                  className="cropper-btn ghost"
                  onClick={() => setActiveCropFile(null)}
                >
                  Пропустить
                </button>
                <button
                  type="button"
                  className={`cropper-btn${isCropSaving ? " is-loading" : ""}`}
                  onClick={async () => {
                    if (!croppedAreaPixels || !activeCropFile) {
                      setActiveCropFile(null);
                      return;
                    }
                    if (isCropSaving) {
                      return;
                    }
                    setIsCropSaving(true);
                    const croppedBlob = await getCroppedImage(
                      activeCropFile,
                      croppedAreaPixels
                    );
                    if (croppedBlob) {
                      const croppedFile = new File(
                        [croppedBlob],
                        activeCropFile.name,
                        {
                          type: "image/jpeg",
                        }
                      );
                      const token = sessionStorage.getItem("access_token");
                      const formData = new FormData();
                      formData.append("files", croppedFile);
                      const uploadResponse = await fetch("/api/v1/tutors/me/photos", {
                        method: "POST",
                        body: formData,
                        credentials: "include",
                        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                      });
                      if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        if (Array.isArray(uploadData.photo_paths)) {
                          setExistingPhotos(uploadData.photo_paths);
                          const avatarPath = uploadData.photo_paths[0] || "";
                          if (avatarPath) {
                            setSelectedAvatarChoice(`existing:${avatarPath}`);
                          }
                        }
                      } else {
                        try {
                          const uploadError = await uploadResponse.json();
                          if (uploadError?.detail) {
                            setError(uploadError.detail);
                          } else {
                            setError("Не удалось загрузить фото.");
                          }
                        } catch {
                          setError("Не удалось загрузить фото.");
                        }
                      }
                    }
                    setActiveCropFile(null);
                    setIsCropSaving(false);
                  }}
                >
                  Сохранить кадр
                  <span className="loader"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

async function getCroppedImage(file: File, area: Area): Promise<Blob | null> {
  const image = await createImage(URL.createObjectURL(file));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = area.width;
  canvas.height = area.height;

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob ?? null);
      },
      "image/jpeg",
      0.85
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}
