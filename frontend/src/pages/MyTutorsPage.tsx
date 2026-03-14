import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/my_tutors.css";

type UserInfo = {
  id: number;
  role: "student" | "tutor" | "admin";
};

type TutorItem = {
  name: string;
  subject?: string | null;
  status?: "confirmed" | "pending" | "cooldown" | null;
  cooldown_until?: string | null;
  phone?: string | null;
  telegram?: string | null;
  schedule?: any[] | Record<string, string[]>;
};

type StudentItem = {
  name: string;
  email?: string | null;
  status?: "confirmed" | "pending" | "cooldown" | null;
  cooldown_until?: string | null;
  confirmed?: boolean | null;
};

type RegisteredResponse =
  | TutorItem[]
  | {
      tutors?: TutorItem[];
      students?: StudentItem[];
    };

export default function MyTutorsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tutors, setTutors] = useState<TutorItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [activeTab, setActiveTab] = useState<"tutors" | "students">("tutors");
  const [error, setError] = useState("");
  const [timeTick, setTimeTick] = useState(0);
  const isAuthenticated = Boolean(sessionStorage.getItem("access_token"));
  const enableTimeTravel = import.meta.env.VITE_ENABLE_TIME_TRAVEL === "true";

  const getNow = () => {
    if (enableTimeTravel) {
      const stored = localStorage.getItem("guroo:test-time");
      if (stored) {
        const parsed = new Date(stored);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return new Date();
  };

  useEffect(() => {
    const handler = () => setTimeTick(Date.now());
    window.addEventListener("guroo:test-time-changed", handler as EventListener);
    const interval = setInterval(handler, 60000);
    return () => {
      window.removeEventListener("guroo:test-time-changed", handler as EventListener);
      clearInterval(interval);
    };
  }, []);

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
    const loadRegistered = async () => {
      if (!user) return;
      const response = await apiFetch(`/api/v1/tutors/registered?user_id=${user.id}&kind=tutors`);
      if (!response.ok) {
        setError("Не удалось загрузить данные.");
        return;
      }
      const data: RegisteredResponse = await response.json();
      if (Array.isArray(data)) {
        setTutors(data);
        setStudents([]);
        setActiveTab("tutors");
        return;
      }
      setTutors(data.tutors ?? []);
      setStudents(data.students ?? []);
      setActiveTab("tutors");
    };
    loadRegistered();
  }, [user]);

  const formatNextLesson = useMemo(
    () => (schedule?: any[] | Record<string, string[]>) => {
      if (!schedule) return null;
      const entries: {
        day: string;
        time: string;
        location?: string;
        start: Date;
        end: Date;
      }[] = [];
      const dayMap: Record<string, number> = {
        "Понедельник": 1,
        "Вторник": 2,
        "Среда": 3,
        "Четверг": 4,
        "Пятница": 5,
        "Суббота": 6,
        "Воскресенье": 0,
      };
      const timeMap: Record<string, string> = {
        "1": "08:00",
        "2": "09:30",
        "3": "11:40",
        "4": "13:10",
        "5": "14:40",
        "6": "16:00",
        "7": "17:30",
      };
      const lessonRanges: Record<string, string> = {
        "1": "08:00 - 09:20",
        "2": "09:30 - 10:50",
        "3": "11:40 - 13:00",
        "4": "13:10 - 14:30",
        "5": "14:40 - 16:00",
        "6": "16:00 - 17:20",
        "7": "17:30 - 19:00",
      };
      const parseTime = (value: string) => value.split(":").map(Number);
      const now = getNow();
      const base = new Date(now);
      if (Array.isArray(schedule)) {
        schedule.forEach((entry) => {
          const day = String(entry.day || "");
          const pair = String(entry.pair || "");
          if (!day || !pair) return;
          const weekday = dayMap[day];
          if (weekday === undefined) return;
          const range = lessonRanges[pair];
          const [startHour, startMinute] = parseTime(
            range ? range.split("-")[0].trim() : timeMap[pair] || "08:00"
          );
          const [endHour, endMinute] = parseTime(
            range ? range.split("-")[1].trim() : "09:20"
          );
          const start = new Date(base);
          const diff = (weekday - start.getDay() + 7) % 7;
          start.setDate(start.getDate() + diff);
          start.setHours(startHour, startMinute, 0, 0);
          const end = new Date(start);
          end.setHours(endHour, endMinute, 0, 0);
          if (end < now) {
            start.setDate(start.getDate() + 7);
            end.setDate(end.getDate() + 7);
          }
          entries.push({
            day,
            time: timeMap[pair] || pair,
            location: entry.location ? String(entry.location) : undefined,
            start,
            end,
          });
        });
      } else {
        Object.entries(schedule).forEach(([day, pairs]) => {
          const weekday = dayMap[day];
          if (weekday === undefined) return;
          (pairs || []).forEach((pair) => {
            const pairKey = String(pair);
            const range = lessonRanges[pairKey];
            const [startHour, startMinute] = parseTime(
              range ? range.split("-")[0].trim() : timeMap[pairKey] || "08:00"
            );
            const [endHour, endMinute] = parseTime(
              range ? range.split("-")[1].trim() : "09:20"
            );
            const start = new Date(base);
            const diff = (weekday - start.getDay() + 7) % 7;
            start.setDate(start.getDate() + diff);
            start.setHours(startHour, startMinute, 0, 0);
            const end = new Date(start);
            end.setHours(endHour, endMinute, 0, 0);
            if (end < now) {
              start.setDate(start.getDate() + 7);
              end.setDate(end.getDate() + 7);
            }
            entries.push({
              day,
              time: timeMap[pairKey] || pairKey,
              start,
              end,
            });
          });
        });
      }
      if (entries.length === 0) return null;
      entries.sort((a, b) => a.start.getTime() - b.start.getTime());
      const next = entries[0];
      const diffMs = next.start.getTime() - now.getTime();
      const hours = Math.max(0, Math.floor(diffMs / 3600000));
      const minutes = Math.max(0, Math.floor((diffMs % 3600000) / 60000));
      return {
        label: `${next.day}: ${next.time}`,
        location: next.location || null,
        remaining: `${hours}ч ${minutes}м`,
        isLive: now >= next.start && now <= next.end,
      };
    },
    [timeTick, enableTimeTravel],
  );

  const tabs = useMemo(() => {
    if (user?.role === "tutor") {
      return ["students", "tutors"] as const;
    }
    return ["tutors"] as const;
  }, [user]);

  return (
    <>
      <Header />
      <div className="wrapper page-my-tutors">
        <div className="my-tutors-hero">
          <div>
            <h1>Мои тьюторы</h1>
            <p>Тьюторы, к которым вы записаны или ожидание подтверждения.</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="my-tutors-card">Войдите, чтобы увидеть список.</div>
        )}

        {error && <div className="my-tutors-error">{error}</div>}

        {isAuthenticated && (
          <>
            <div className="my-tutors-grid">
              {tutors.length === 0 && (
                <div className="my-tutors-empty">Пока нет подтвержденных тьюторов.</div>
              )}
              {tutors.map((tutor, index) => (
                <div className="my-tutors-card" key={`${tutor.name}-${index}`}>
                  {(() => {
                    const nextLesson = formatNextLesson(tutor.schedule);
                    return (
                      <>
                  <h3>{tutor.name}</h3>
                  <p>{tutor.subject ?? "Предмет не указан"}</p>
                  <p>{tutor.phone ?? "Телефон не указан"}</p>
                  {tutor.telegram ? (
                    <a href={tutor.telegram} target="_blank" rel="noreferrer">
                      Телеграм-группа
                    </a>
                  ) : (
                    <p>Телеграм не указан</p>
                  )}
                  {nextLesson && (
                    <div className="my-tutors-status">
                      {nextLesson.isLive ? "Урок уже идёт!" : "Следующий урок:"} {nextLesson.label}
                      {nextLesson.location && ` · ${nextLesson.location}`}
                      {!nextLesson.isLive && (
                        <>
                          {" · осталось "}
                          {nextLesson.remaining}
                        </>
                      )}
                    </div>
                  )}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
