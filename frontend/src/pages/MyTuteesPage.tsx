import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/my_tutors.css";

type UserInfo = {
  id: number;
  role: "student" | "tutor" | "admin";
};

type StudentItem = {
  id: number;
  name: string;
  email?: string | null;
  group?: string | null;
  status?: "confirmed" | "pending" | "cooldown" | null;
  cooldown_until?: string | null;
  attended?: boolean;
};

type LessonResponse = {
  students: StudentItem[];
  show_fields: boolean;
  topic: string;
  location: string;
  active_lesson?: {
    day: string;
    time: string;
    location?: string;
  } | null;
};

export default function MyTuteesPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [error, setError] = useState("");
  const [showFields, setShowFields] = useState(false);
  const [lessonTopic, setLessonTopic] = useState("");
  const [activeLesson, setActiveLesson] = useState<LessonResponse["active_lesson"] | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isAuthenticated = Boolean(sessionStorage.getItem("access_token"));

  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated) return;
      const response = await apiFetch("/api/v1/auth/me");
      if (!response.ok) {
        setError("Не удалось загрузить профиль.");
        return;
      }
      const data = await response.json();
      setUser(data);
    };
    loadUser();
  }, [isAuthenticated]);

  useEffect(() => {
    const loadLessons = async () => {
      if (!user) return;
      if (user.role !== "tutor") {
        setError("Раздел доступен только тьюторам.");
        return;
      }
      const response = await apiFetch(`/api/v1/tutors/my-lessons?tutor_id=${user.id}`);
      if (!response.ok) {
        setError("Не удалось загрузить данные.");
        return;
      }
      const data: LessonResponse = await response.json();
      setStudents(data.students ?? []);
      setShowFields(Boolean(data.show_fields));
      setLessonTopic(data.topic ?? "");
      setActiveLesson(data.active_lesson ?? null);
      setAttendanceMap(
        (data.students ?? []).reduce<Record<number, boolean>>((acc, student) => {
          acc[student.id] = Boolean(student.attended);
          return acc;
        }, {})
      );
    };
    loadLessons();
  }, [user]);

  const formatStatus = useMemo(
    () => (status?: string | null, cooldown?: string | null) => {
      if (status === "confirmed") return "Подтверждён";
      if (status === "cooldown" && cooldown) {
        const until = new Date(cooldown);
        return `Отказано до ${until.toLocaleString()}`;
      }
      if (status === "pending") return "Ожидает подтверждения";
      return "—";
    },
    []
  );

  return (
    <>
      <Header />
      <div className="wrapper page-my-tutors">
        <div className="my-tutors-hero">
          <div>
            <h1>Мои тьюти</h1>
            <p>Студенты, которые записались к вам.</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="my-tutors-card">Войдите, чтобы увидеть список.</div>
        )}

        {error && <div className="my-tutors-error">{error}</div>}

        {isAuthenticated && (
          <div className="my-tutors-grid">
            {showFields ? (
              <div className="my-tutors-card">
                <h3>Отметка посещаемости</h3>
                {activeLesson && (
                  <p className="my-tutors-status">
                    Сейчас идёт: {activeLesson.day} {activeLesson.time}
                    {activeLesson.location ? ` · ${activeLesson.location}` : ""}
                  </p>
                )}
                <label className="my-tutors-label">Тема урока</label>
                <input
                  className="my-tutors-input"
                  value={lessonTopic}
                  onChange={(event) => setLessonTopic(event.target.value)}
                  placeholder="Тема текущего урока"
                />
                <button
                  className={`btn btn-primary${isSaving ? " is-loading" : ""}`}
                  type="button"
                  onClick={async () => {
                    if (isSaving) return;
                    setIsSaving(true);
                    setMessage("");
                    setError("");
                    const presentIds = students
                      .filter((student) => attendanceMap[student.id])
                      .map((student) => student.id);
                    const response = await apiFetch("/api/v1/tutors/lesson-attendance", {
                      method: "POST",
                      body: JSON.stringify({
                        student_ids: presentIds,
                        topic: lessonTopic,
                        location: activeLesson?.location || "",
                      }),
                    });
                    if (response.ok) {
                      setMessage("Данные сохранены.");
                    } else {
                      try {
                        const data = await response.json();
                        setError(data?.detail || "Не удалось сохранить.");
                      } catch {
                        setError("Не удалось сохранить.");
                      }
                    }
                    setIsSaving(false);
                  }}
                >
                  Сохранить
                  <span className="loader"></span>
                </button>
                {message && <p className="form-success">{message}</p>}
              </div>
            ) : (
              <div className="my-tutors-card">
                Сейчас нет активного окна отметок. Доступно во время урока и 1 час после.
              </div>
            )}

            {students.length === 0 && (
              <div className="my-tutors-empty">Пока нет тьюти.</div>
            )}
            {students.map((student) => (
              <div className="my-tutors-card" key={`${student.name}-${student.id}`}>
                <h3>{student.name}</h3>
                <p>{student.group ?? "Группа не указана"}</p>
                {showFields ? (
                  <label className="my-tutors-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(attendanceMap[student.id])}
                      onChange={() =>
                        setAttendanceMap((prev) => ({
                          ...prev,
                          [student.id]: !prev[student.id],
                        }))
                      }
                    />
                    Был на уроке
                  </label>
                ) : (
                  <p className="my-tutors-status">
                    {formatStatus(student.status, student.cooldown_until)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
