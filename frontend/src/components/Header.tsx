import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { apiFetch } from "../lib/api";

type UserSummary = {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  role?: "student" | "tutor" | "admin";
};

type NotificationItem = {
  id: number;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  payload?: {
    student_id?: number;
    tutor_id?: number;
    enrollment_id?: number;
  } | null;
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifError, setNotifError] = useState("");
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const notifRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const authenticated = Boolean(token);
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setUser(null);
      return;
    }

    const loadUser = async () => {
      const response = await apiFetch("/api/v1/auth/me");
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as UserSummary;
      setUser(data);
    };
    loadUser();
  }, [location.pathname]);

  useEffect(() => {
    if (!showNotifications || !isAuthenticated) {
      return;
    }
    const loadNotifications = async () => {
      setNotifError("");
      const response = await apiFetch("/api/v1/notifications/");
      if (!response.ok) {
        setNotifError("Не удалось загрузить уведомления.");
        return;
      }
      const data = await response.json();
      setNotifications(data.notifications ?? []);
    };
    loadNotifications();
  }, [showNotifications, isAuthenticated]);

  useEffect(() => {
    if (!showNotifications && !showProfileMenu) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        showNotifications &&
        notifRef.current &&
        !notifRef.current.contains(target) &&
        bellRef.current &&
        !bellRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (showProfileMenu && menuRef.current && !menuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications, showProfileMenu]);

  const onLogout = () => {
    sessionStorage.removeItem("access_token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  const markNotificationRead = async (id: number) => {
    const response = await apiFetch(`/api/v1/notifications/${id}/read`, {
      method: "POST",
    });
    if (!response.ok) {
      setNotifError("Не удалось отметить уведомление.");
      return;
    }
    let updated: Partial<NotificationItem> | null = null;
    try {
      const data = await response.json();
      updated = data.notification ?? null;
    } catch {
      updated = null;
    }
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              is_read: true,
              ...(updated ? (updated as Partial<NotificationItem>) : {}),
            }
          : item,
      ),
    );
  };

  const markAllRead = async () => {
    const response = await apiFetch("/api/v1/notifications/read-all", {
      method: "POST",
    });
    if (!response.ok) {
      setNotifError("Не удалось отметить все уведомления.");
      return;
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
  };

  const handleTutorRequest = async (
    id: number,
    action: "confirm" | "decline",
    studentId?: number,
    tutorId?: number,
    reason?: string,
  ) => {
    if (!studentId || !tutorId) {
      setNotifError("Нет данных для обработки заявки.");
      return;
    }
    if (action === "decline") {
      const trimmed = String(reason ?? "").trim();
      if (!trimmed) {
        setNotifError("Укажите причину отказа.");
        return;
      }
    }
    const response = await apiFetch(`/api/v1/tutors/${action}`, {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        tutor_id: tutorId,
        notification_id: id,
        ...(action === "decline" ? { reason } : {}),
      }),
    });
    if (!response.ok) {
      try {
        const data = await response.json();
        setNotifError(data.detail || "Не удалось обработать заявку.");
      } catch {
        setNotifError("Не удалось обработать заявку.");
      }
      return;
    }
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );
    if (action === "decline") {
      setDeclineId(null);
      setDeclineReason("");
    }
  };

  const handleRsvp = async (notificationId: number, enrollmentId: number, willAttend: boolean) => {
    const response = await apiFetch(`/api/v1/lessons/${enrollmentId}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ will_attend: willAttend }),
    });
    if (!response.ok) {
      setNotifError("Не удалось подтвердить посещение.");
      return;
    }
    await markNotificationRead(notificationId);
  };

  const initials = `${user?.first_name?.[0] ?? "U"}${user?.last_name?.[0] ?? ""}`.toUpperCase();
  return (
    <div className="head-cont">
      <header>
        <div className="head-left">
          <h3 className="head-left-logo">GUROO</h3>
          <h4 className="head-left-text">
            <Link to="/">Главная</Link>
          </h4>
          <h4 className="head-left-text">
            <Link to="/tutors">Тьюторы</Link>
          </h4>
          <h4 className="head-left-text">
            <Link to="/about">О нас</Link>
          </h4>
        </div>
        {isAuthenticated ? (
          <div className="profile">
            <button
              type="button"
              className="notification-bell"
              ref={bellRef}
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowProfileMenu(false);
              }}
            >
              <i className="fas fa-bell"></i>
              {notifications.some((item) => !item.is_read) && (
                <span className="notification-dot"></span>
              )}
            </button>
            <div className="profile-menu-wrapper" ref={menuRef}>
              <button
                type="button"
                className="avatar"
                id="avatar"
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowNotifications(false);
                }}
              >
                <span className="avatar-text">{initials}</span>
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <Link to="/notifications">Уведомления</Link>
                  <Link to="/my-tutors">Мои тьюторы</Link>
                  {user?.role === "tutor" && (
                    <Link to="/my-tutees">Мои тьюти</Link>
                  )}
                  {user?.role === "tutor" && (
                    <Link to="/edit-profile">Редактировать анкету</Link>
                  )}
                  <button type="button" onClick={onLogout}>
                    Выйти
                  </button>
                </div>
              )}
            </div>
            <span id="user-name">
              {user?.first_name} {user?.last_name}
            </span>
            {showNotifications && (
              <div className="notifications-dropdown" ref={notifRef}>
                <div className="notifications-header">
                  <span>Уведомления</span>
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={!notifications.some((item) => !item.is_read)}
                  >
                    Прочитать все
                  </button>
                </div>
                {notifError && <div className="notifications-error">{notifError}</div>}
                <div className="notifications-list">
                  {notifications.length === 0 && !notifError && (
                    <div className="notifications-empty">Пока уведомлений нет.</div>
                  )}
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notification-item ${item.is_read ? "read" : "unread"}`}
                    >
                      <div className="notification-time">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                      <div className="notification-message">{item.message}</div>
                      <div className="notification-actions">
                        {!item.is_read && (
                          <button type="button" onClick={() => markNotificationRead(item.id)}>
                            Прочитано
                          </button>
                        )}
                        {item.notification_type === "tutor_request" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleTutorRequest(
                                  item.id,
                                  "confirm",
                                  item.payload?.student_id,
                                  item.payload?.tutor_id,
                                )
                              }
                            >
                              Принять
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeclineId(item.id);
                                setDeclineReason("");
                                setNotifError("");
                              }}
                            >
                              Отклонить
                            </button>
                            {declineId === item.id && (
                              <div className="notification-decline">
                                <textarea
                                  value={declineReason}
                                  onChange={(event) => setDeclineReason(event.target.value)}
                                  placeholder="Причина отказа"
                                  rows={2}
                                />
                                <div className="notification-decline-actions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleTutorRequest(
                                        item.id,
                                        "decline",
                                        item.payload?.student_id,
                                        item.payload?.tutor_id,
                                        declineReason,
                                      )
                                    }
                                  >
                                    Отправить
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeclineId(null);
                                      setDeclineReason("");
                                    }}
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {(item.notification_type === "lesson_accepted" ||
                          item.notification_type === "lesson_rsvp_prompt") && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                item.payload?.enrollment_id &&
                                handleRsvp(item.id, item.payload.enrollment_id, true)
                              }
                            >
                              Пойду
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                item.payload?.enrollment_id &&
                                handleRsvp(item.id, item.payload.enrollment_id, false)
                              }
                            >
                              Не пойду
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notifications-footer">
                  <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                    Открыть все
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="head-right">
            Войти
          </Link>
        )}
      </header>
    </div>
  );
}
