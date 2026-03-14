import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/lessons.css";

type UserInfo = {
  id: number;
  role: "student" | "tutor" | "admin";
  first_name?: string | null;
  last_name?: string | null;
};

type StudentLessonItem = {
  id: number; // enrollment_id
  tutor_id: number;
  tutor_name: string;
  subject?: string | null;
  lesson_date: string;
  slot_id: string;
  status: string;
  decline_reason?: string | null;
  attendance_status: string;
  topic?: string | null;
  location?: string | null;
};

type EnrollmentStudent = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  group?: string | null;
};

type LessonEnrollmentOut = {
  id: number;
  status: string;
  decline_reason?: string | null;
  attendance_status: string;
  student: EnrollmentStudent;
};

type TutorLessonItem = {
  id: number; // lesson_id
  lesson_date: string;
  slot_id: string;
  topic?: string | null;
  location?: string | null;
  enrollments: LessonEnrollmentOut[];
};

const lessonTimes: Record<string, string> = {
  "1": "08:00 - 09:20",
  "2": "09:30 - 10:50",
  "3": "11:40 - 13:00",
  "4": "13:10 - 14:30",
  "5": "14:40 - 16:00",
  "6": "16:00 - 17:20",
  "7": "17:30 - 19:00",
};

const roomOptions = [
  "Балкон",
  ...Array.from({ length: 11 }, (_, index) => `C${index + 1}`),
  "LAB1",
  "LAB2",
  "LAB3",
];

const toDateLabel = (raw: string) => {
  const date = new Date(raw);
  return date.toLocaleDateString();
};

const isToday = (raw: string) => {
  const date = new Date(raw);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

const isTomorrow = (raw: string) => {
  const date = new Date(raw);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

export default function LessonsPage() {
  const isAuthenticated = Boolean(sessionStorage.getItem("access_token"));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [studentItems, setStudentItems] = useState<StudentLessonItem[]>([]);
  const [tutorLessons, setTutorLessons] = useState<TutorLessonItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "upcoming">("overview");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [declineEnrollmentId, setDeclineEnrollmentId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [detailsLessonId, setDetailsLessonId] = useState<number | null>(null);
  const [detailsTopic, setDetailsTopic] = useState("");
  const [detailsLocation, setDetailsLocation] = useState(roomOptions[0]);

  const [attendanceLessonId, setAttendanceLessonId] = useState<number | null>(null);
  const [attendanceSelected, setAttendanceSelected] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated) return;
      const response = await apiFetch("/api/v1/auth/me");
      if (!response.ok) {
        setError("Не удалось загрузить профиль.");
        return;
      }
      const data = (await response.json()) as UserInfo;
      setUser(data);
      setActiveTab(data.role === "tutor" ? "requests" : "overview");
    };
    loadUser();
  }, [isAuthenticated]);

  const reloadStudent = async () => {
    const response = await apiFetch("/api/v1/lessons/student");
    if (!response.ok) {
      setError("Не удалось загрузить уроки студента.");
      return;
    }
    const data = (await response.json()) as StudentLessonItem[];
    setStudentItems(data ?? []);
  };

  const reloadTutor = async () => {
    const response = await apiFetch("/api/v1/lessons/tutor");
    if (!response.ok) {
      setError("Не удалось загрузить уроки тьютора.");
      return;
    }
    const data = (await response.json()) as TutorLessonItem[];
    setTutorLessons(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    setError("");
    setMessage("");
    if (user.role === "student") {
      reloadStudent();
      return;
    }
    if (user.role === "tutor") {
      reloadTutor();
    }
  }, [user]);

  const studentGroups = useMemo(() => {
    const pending = studentItems.filter((item) => item.status === "requested");
    const waitingRsvp = studentItems.filter((item) => item.status === "tutor_accepted");
    const upcoming = studentItems.filter((item) => item.status === "student_confirmed");
    const history = studentItems.filter(
      (item) =>
        !["requested", "tutor_accepted", "student_confirmed"].includes(item.status),
    );
    return { pending, waitingRsvp, upcoming, history };
  }, [studentItems]);

  const tutorGroups = useMemo(() => {
    const requested: { enrollment: LessonEnrollmentOut; lesson: TutorLessonItem }[] = [];
    const upcoming: TutorLessonItem[] = [];

    tutorLessons.forEach((lesson) => {
      if (lesson.enrollments.some((en) => en.status === "requested")) {
        lesson.enrollments
          .filter((en) => en.status === "requested")
          .forEach((enrollment) => requested.push({ enrollment, lesson }));
      }
      if (
        lesson.enrollments.some((en) => ["tutor_accepted", "student_confirmed"].includes(en.status))
      ) {
        upcoming.push(lesson);
      }
    });

    const upcomingSorted = upcoming.sort(
      (a, b) => new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime(),
    );
    return { requested, upcoming: upcomingSorted };
  }, [tutorLessons]);

  const rsvp = async (enrollmentId: number, willAttend: boolean) => {
    setError("");
    setMessage("");
    const response = await apiFetch(`/api/v1/lessons/${enrollmentId}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ will_attend: willAttend }),
    });
    if (!response.ok) {
      try {
        const data = await response.json();
        setError(data.detail || "Не удалось подтвердить посещение.");
      } catch {
        setError("Не удалось подтвердить посещение.");
      }
      return;
    }
    setMessage(willAttend ? "Подтверждение отправлено." : "Отказ отправлен.");
    await reloadStudent();
  };

  const cancelEnrollment = async (enrollmentId: number) => {
    setError("");
    setMessage("");
    const response = await apiFetch(`/api/v1/lessons/${enrollmentId}/cancel`, {
      method: "POST",
    });
    if (!response.ok) {
      try {
        const data = await response.json();
        setError(data.detail || "Не удалось отменить.");
      } catch {
        setError("Не удалось отменить.");
      }
      return;
    }
    setMessage("Запись отменена.");
    await reloadStudent();
  };

  const acceptEnrollment = async (enrollmentId: number) => {
    setError("");
    setMessage("");
    const response = await apiFetch(`/api/v1/lessons/${enrollmentId}/accept`, {
      method: "POST",
    });
    if (!response.ok) {
      try {
        const data = await response.json();
        setError(data.detail || "Не удалось принять заявку.");
      } catch {
        setError("Не удалось принять заявку.");
      }
      return;
    }
    setMessage("Заявка принята.");
    await reloadTutor();
  };

  const declineEnrollment = async (enrollmentId: number) => {
    setError("");
    setMessage("");
    const reason = declineReason.trim();
    if (!reason) {
      setError("Укажите причину отказа.");
      return;
    }
    const response = await apiFetch(`/api/v1/lessons/${enrollmentId}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      try {
        const data = await response.json();
        setError(data.detail || "Не удалось отклонить.");
      } catch {
        setError("Не удалось отклонить.");
      }
      return;
    }
    setMessage("Заявка отклонена.");
    setDeclineEnrollmentId(null);
    setDeclineReason("");
    await reloadTutor();
  };

  const openLessonDetails = (lesson: TutorLessonItem) => {
    setDetailsLessonId(lesson.id);
    setDetailsTopic(lesson.topic ?? "");
    setDetailsLocation(lesson.location ?? roomOptions[0]);
  };

  const saveLessonDetails = async () => {
    if (!detailsLessonId) return;
    setError("");
    setMessage("");
    const response = await apiFetch(`/api/v1/lessons/${detailsLessonId}/details`, {
      method: "POST",
      body: JSON.stringify({ topic: detailsTopic, location: detailsLocation }),
    });
    if (!response.ok) {
      try {
        const data = await response.json();
        setError(data.detail || "Не удалось сохранить.");
      } catch {
        setError("Не удалось сохранить.");
      }
      return;
    }
    setMessage("Детали занятия сохранены.");
    setDetailsLessonId(null);
    await reloadTutor();
  };

  const openAttendance = (lesson: TutorLessonItem) => {
    setAttendanceLessonId(lesson.id);
    const nextState: Record<number, boolean> = {};
    lesson.enrollments
      .filter((en) => en.status === "student_confirmed")
      .forEach((en) => {
        nextState[en.student.id] = en.attendance_status === "present";
      });
    setAttendanceSelected(nextState);
  };

  const attendanceStudents = useMemo(() => {
    if (!attendanceLessonId) return [];
    const lesson = tutorLessons.find((item) => item.id === attendanceLessonId);
    if (!lesson) return [];
    return lesson.enrollments
      .filter((en) => en.status === "student_confirmed")
      .map((en) => en.student);
  }, [attendanceLessonId, tutorLessons]);

  const saveAttendance = async () => {
    if (!attendanceLessonId) return;
    setError("");
    setMessage("");
    const presentStudentIds = Object.entries(attendanceSelected)
      .filter(([, isPresent]) => Boolean(isPresent))
      .map(([id]) => Number(id));
    const response = await apiFetch(`/api/v1/lessons/${attendanceLessonId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ present_student_ids: presentStudentIds }),
    });
    if (!response.ok) {
      try {
        const data = await response.json();
        setError(data.detail || "Не удалось сохранить посещаемость.");
      } catch {
        setError("Не удалось сохранить посещаемость.");
      }
      return;
    }
    setMessage("Посещаемость сохранена.");
    setAttendanceLessonId(null);
    await reloadTutor();
  };

  const isTutor = user?.role === "tutor";
  const isStudent = user?.role === "student";

  return (
    <>
      <Header />
      <div className="wrapper page-lessons">
        <div className="lessons-hero">
          <div>
            <h1>Уроки</h1>
            <p>
              {isStudent &&
                "Здесь ваши заявки, подтверждения и занятия. Запись доступна только на завтра после 08:00."}
              {isTutor &&
                "Здесь заявки на занятия, предстоящие уроки, тема/кабинет и отметка посещений."}
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="lessons-empty">Войдите, чтобы продолжить.</div>
        )}

        {error && <div className="lessons-error">{error}</div>}
        {message && <div className="lessons-success">{message}</div>}

        {isAuthenticated && user && (
          <>
            <div className="lessons-tabs">
              <button
                type="button"
                className={activeTab === "overview" ? "active" : ""}
                onClick={() => setActiveTab("overview")}
              >
                Обзор
              </button>
              {isTutor && (
                <button
                  type="button"
                  className={activeTab === "requests" ? "active" : ""}
                  onClick={() => setActiveTab("requests")}
                >
                  Заявки
                </button>
              )}
              <button
                type="button"
                className={activeTab === "upcoming" ? "active" : ""}
                onClick={() => setActiveTab("upcoming")}
              >
                Предстоящие
              </button>
            </div>

            {isStudent && activeTab === "overview" && (
              <div className="lessons-grid">
                <div className="lessons-card">
                  <h2>Ожидают ответа тьютора</h2>
                  {studentGroups.pending.length === 0 && (
                    <div className="lessons-muted">Пока нет заявок.</div>
                  )}
                  {studentGroups.pending.map((item) => (
                    <div className="lesson-row" key={item.id}>
                      <div className="lesson-row-main">
                        <strong>{item.tutor_name}</strong>
                        <span>{item.subject ?? "Предмет не указан"}</span>
                      </div>
                      <div className="lesson-row-meta">
                        <span>{toDateLabel(item.lesson_date)}</span>
                        <span>{lessonTimes[item.slot_id] ?? item.slot_id}</span>
                      </div>
                      <div className="lesson-row-actions">
                        <button type="button" onClick={() => cancelEnrollment(item.id)}>
                          Отменить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lessons-card">
                  <h2>Нужно подтвердить посещение</h2>
                  {studentGroups.waitingRsvp.length === 0 && (
                    <div className="lessons-muted">Нет занятий, требующих RSVP.</div>
                  )}
                  {studentGroups.waitingRsvp.map((item) => (
                    <div className="lesson-row" key={item.id}>
                      <div className="lesson-row-main">
                        <strong>{item.tutor_name}</strong>
                        <span>{item.subject ?? "Предмет не указан"}</span>
                      </div>
                      <div className="lesson-row-meta">
                        <span>{toDateLabel(item.lesson_date)}</span>
                        <span>{lessonTimes[item.slot_id] ?? item.slot_id}</span>
                      </div>
                      <div className="lesson-row-actions">
                        <button type="button" onClick={() => rsvp(item.id, true)}>
                          Пойду
                        </button>
                        <button type="button" onClick={() => rsvp(item.id, false)}>
                          Не пойду
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lessons-card lessons-card-full">
                  <h2>История</h2>
                  {studentGroups.history.length === 0 && (
                    <div className="lessons-muted">Пока нет истории.</div>
                  )}
                  {studentGroups.history.map((item) => (
                    <div className="lesson-row" key={item.id}>
                      <div className="lesson-row-main">
                        <strong>{item.tutor_name}</strong>
                        <span>{item.subject ?? "Предмет не указан"}</span>
                      </div>
                      <div className="lesson-row-meta">
                        <span>{toDateLabel(item.lesson_date)}</span>
                        <span>{lessonTimes[item.slot_id] ?? item.slot_id}</span>
                        <span className="lesson-status">{item.status}</span>
                      </div>
                      {item.status === "tutor_declined" && item.decline_reason && (
                        <div className="lesson-row-note">Причина: {item.decline_reason}</div>
                      )}
                      {item.topic && (
                        <div className="lesson-row-note">
                          Тема: {item.topic} · Место: {item.location ?? "-"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isTutor && activeTab === "requests" && (
              <div className="lessons-grid">
                <div className="lessons-card lessons-card-full">
                  <h2>Заявки на занятия</h2>
                  {tutorGroups.requested.length === 0 && (
                    <div className="lessons-muted">Пока нет новых заявок.</div>
                  )}
                  {tutorGroups.requested.map(({ enrollment, lesson }) => (
                    <div className="lesson-row" key={enrollment.id}>
                      <div className="lesson-row-main">
                        <strong>
                          {enrollment.student.last_name} {enrollment.student.first_name}
                        </strong>
                        <span>{enrollment.student.group ?? "Группа не указана"}</span>
                      </div>
                      <div className="lesson-row-meta">
                        <span>{toDateLabel(lesson.lesson_date)}</span>
                        <span>{lessonTimes[lesson.slot_id] ?? lesson.slot_id}</span>
                      </div>
                      <div className="lesson-row-actions">
                        <button type="button" onClick={() => acceptEnrollment(enrollment.id)}>
                          Принять
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeclineEnrollmentId(enrollment.id);
                            setDeclineReason("");
                          }}
                        >
                          Отклонить
                        </button>
                      </div>
                      {declineEnrollmentId === enrollment.id && (
                        <div className="lesson-inline">
                          <textarea
                            value={declineReason}
                            onChange={(event) => setDeclineReason(event.target.value)}
                            placeholder="Причина отказа"
                            rows={2}
                          />
                          <div className="lesson-inline-actions">
                            <button
                              type="button"
                              onClick={() => declineEnrollment(enrollment.id)}
                            >
                              Отправить
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeclineEnrollmentId(null);
                                setDeclineReason("");
                              }}
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "upcoming" && isStudent && (
              <div className="lessons-grid">
                <div className="lessons-card lessons-card-full">
                  <h2>Предстоящие занятия</h2>
                  {studentGroups.upcoming.length === 0 && (
                    <div className="lessons-muted">Нет подтвержденных занятий.</div>
                  )}
                  {studentGroups.upcoming.map((item) => (
                    <div className="lesson-row" key={item.id}>
                      <div className="lesson-row-main">
                        <strong>{item.tutor_name}</strong>
                        <span>{item.subject ?? "Предмет не указан"}</span>
                      </div>
                      <div className="lesson-row-meta">
                        <span className={isTomorrow(item.lesson_date) ? "badge" : ""}>
                          {toDateLabel(item.lesson_date)}
                        </span>
                        <span>{lessonTimes[item.slot_id] ?? item.slot_id}</span>
                        {item.location && <span className="badge">{item.location}</span>}
                      </div>
                      {(item.topic || item.location) && (
                        <div className="lesson-row-note">
                          {item.topic ? `Тема: ${item.topic}` : ""}{" "}
                          {item.location ? `· Место: ${item.location}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "upcoming" && isTutor && (
              <div className="lessons-grid">
                <div className="lessons-card lessons-card-full">
                  <h2>Предстоящие занятия</h2>
                  {tutorGroups.upcoming.length === 0 && (
                    <div className="lessons-muted">Пока нет занятий.</div>
                  )}
                  {tutorGroups.upcoming.map((lesson) => {
                    const confirmed = lesson.enrollments.filter(
                      (en) => en.status === "student_confirmed",
                    );
                    const accepted = lesson.enrollments.filter(
                      (en) => en.status === "tutor_accepted",
                    );
                    return (
                      <div className="lesson-block" key={lesson.id}>
                        <div className="lesson-block-header">
                          <div>
                            <strong>{toDateLabel(lesson.lesson_date)}</strong>{" "}
                            <span className={isToday(lesson.lesson_date) ? "badge" : ""}>
                              {lessonTimes[lesson.slot_id] ?? lesson.slot_id}
                            </span>
                            {lesson.location && <span className="badge">{lesson.location}</span>}
                          </div>
                          <div className="lesson-block-actions">
                            <button type="button" onClick={() => openLessonDetails(lesson)}>
                              Тема/кабинет
                            </button>
                            <button type="button" onClick={() => openAttendance(lesson)}>
                              Посещаемость
                            </button>
                          </div>
                        </div>
                        <div className="lesson-block-body">
                          {lesson.topic && (
                            <div className="lesson-row-note">Тема: {lesson.topic}</div>
                          )}
                          {accepted.length > 0 && (
                            <div className="lessons-muted">
                              Ожидают RSVP: {accepted.length}
                            </div>
                          )}
                          <div className="lesson-student-grid">
                            {confirmed.length === 0 && (
                              <div className="lessons-muted">
                                Пока никто не подтвердил посещение.
                              </div>
                            )}
                            {confirmed.map((en) => (
                              <div className="student-chip" key={en.id}>
                                {en.student.last_name} {en.student.first_name}{" "}
                                <span className="student-chip-group">
                                  {en.student.group ?? ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailsLessonId && (
        <div className="lesson-modal-overlay" role="dialog" aria-modal="true">
          <div className="lesson-modal">
            <div className="lesson-modal-header">
              <h2>Тема и кабинет</h2>
              <button type="button" onClick={() => setDetailsLessonId(null)}>
                ×
              </button>
            </div>
            <label>
              Тема
              <input
                value={detailsTopic}
                onChange={(event) => setDetailsTopic(event.target.value)}
                placeholder="Например: Глава 3, задачи 1-5"
              />
            </label>
            <label>
              Место
              <select
                value={detailsLocation}
                onChange={(event) => setDetailsLocation(event.target.value)}
              >
                {roomOptions.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </label>
            <div className="lesson-modal-actions">
              <button type="button" onClick={saveLessonDetails}>
                Сохранить
              </button>
              <button type="button" className="secondary" onClick={() => setDetailsLessonId(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {attendanceLessonId && (
        <div className="lesson-modal-overlay" role="dialog" aria-modal="true">
          <div className="lesson-modal">
            <div className="lesson-modal-header">
              <h2>Посещаемость</h2>
              <button type="button" onClick={() => setAttendanceLessonId(null)}>
                ×
              </button>
            </div>
            <div className="lesson-attendance-list">
              {Object.keys(attendanceSelected).length === 0 && (
                <div className="lessons-muted">Нет подтвержденных студентов.</div>
              )}
              {Object.entries(attendanceSelected).map(([id, value]) => {
                const student = attendanceStudents.find((s) => String(s.id) === id);
                const label = student
                  ? `${student.last_name ?? ""} ${student.first_name ?? ""}`.trim()
                  : `Студент ID: ${id}`;
                const group = student?.group ? ` (${student.group})` : "";
                return (
                <label key={id} className="lesson-attendance-row">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) =>
                      setAttendanceSelected((prev) => ({
                        ...prev,
                        [Number(id)]: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    {label}
                    {group}
                  </span>
                </label>
                );
              })}
            </div>
            <div className="lesson-modal-actions">
              <button type="button" onClick={saveAttendance}>
                Сохранить
              </button>
              <button type="button" className="secondary" onClick={() => setAttendanceLessonId(null)}>
                Отмена
              </button>
            </div>
            <div className="lessons-muted">
              Окно отметки: за 10 минут до конца пары и 1 час после окончания.
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
