import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../lib/api";
import "../styles/legacy/notifications.css";

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

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");
  const isAuthenticated = Boolean(sessionStorage.getItem("access_token"));
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "requests" | "lessons" | "other">("all");
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated) {
        return;
      }
      const response = await apiFetch("/api/v1/notifications/");
      if (!response.ok) {
        setError("Unable to load notifications.");
        return;
      }
      const data = await response.json();
      setItems(data.notifications ?? []);
    };
    loadNotifications();
  }, [isAuthenticated]);

  const markNotificationRead = async (id: number) => {
    const response = await apiFetch(`/api/v1/notifications/${id}/read`, {
      method: "POST",
    });
    if (!response.ok) {
      setError("Unable to mark notification as read.");
      return false;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );
    return true;
  };

  const markAllRead = async () => {
    const response = await apiFetch("/api/v1/notifications/read-all", {
      method: "POST",
    });
    if (!response.ok) {
      setError("Unable to mark notifications as read.");
      return;
    }
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
  };

  const handleAction = async (
    id: number,
    action: "confirm" | "decline",
    studentId?: number,
    tutorId?: number,
    reason?: string,
  ) => {
    if (processingIds.has(id)) {
      return;
    }
    if (!studentId || !tutorId) {
      setError("Missing request details.");
      return;
    }
    if (action === "decline") {
      const trimmed = String(reason ?? "").trim();
      if (!trimmed) {
        setError("Укажите причину отказа.");
        return;
      }
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
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
          setError(data.detail || "Не удалось обработать заявку.");
        } catch {
          setError("Не удалось обработать заявку.");
        }
        return;
      }
      let updated: Partial<NotificationItem> | null = null;
      try {
        const data = await response.json();
        updated = data.notification ?? null;
      } catch {
        updated = null;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
                notification_type: "tutor_request_resolved",
                ...(updated ? (updated as Partial<NotificationItem>) : {}),
              }
            : item,
        ),
      );
      if (action === "decline") {
        setDeclineId(null);
        setDeclineReason("");
      }
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRsvp = async (notificationId: number, enrollmentId: number, willAttend: boolean) => {
    const response = await apiFetch(`/api/v1/lessons/${enrollmentId}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ will_attend: willAttend }),
    });
    if (!response.ok) {
      setError("Не удалось подтвердить посещение.");
      return;
    }
    await markNotificationRead(notificationId);
  };

  const hasUnread = items.some((item) => !item.is_read);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((item) => !item.is_read);
    if (filter === "read") return items.filter((item) => item.is_read);
    if (filter === "requests") return items.filter((item) => item.notification_type === "tutor_request");
    if (filter === "lessons") {
      return items.filter((item) => item.notification_type.startsWith("lesson"));
    }
    return items.filter((item) => !item.notification_type.startsWith("lesson") && item.notification_type !== "tutor_request");
  }, [items, filter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};
    const now = new Date();
    filteredItems.forEach((item) => {
      const itemDate = new Date(item.created_at);
      const isToday = itemDate.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = itemDate.toDateString() === yesterday.toDateString();
      const label = isToday ? "Сегодня" : isYesterday ? "Вчера" : itemDate.toLocaleDateString();
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <>
      <Header />
      <div className="wrapper page-notifications">
        <div className="notifications-page">
          <div className="notifications-header">
            <div>
              <h1>Уведомления</h1>
              <p>Все запросы, подтверждения и напоминания в одном месте.</p>
            </div>
            {isAuthenticated && (
              <button type="button" onClick={markAllRead} disabled={!hasUnread}>
                Прочитать все
              </button>
            )}
          </div>

          {!isAuthenticated && <div className="notifications-empty">Войдите, чтобы видеть уведомления.</div>}
          {error && <div className="notifications-error">{error}</div>}

          {isAuthenticated && (
            <>
              <div className="notifications-filters">
                {(
                  ["all", "unread", "read", "requests", "lessons", "other"] as const
                ).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={filter === key ? "active" : ""}
                    onClick={() => setFilter(key)}
                  >
                    {key === "all" && "Все"}
                    {key === "unread" && "Непрочитанные"}
                    {key === "read" && "Прочитанные"}
                    {key === "requests" && "Запросы"}
                    {key === "lessons" && "Уроки"}
                    {key === "other" && "Другое"}
                  </button>
                ))}
              </div>

              {filteredItems.length === 0 && !error && (
                <div className="notifications-empty">Уведомлений пока нет.</div>
              )}

              {Object.entries(groupedItems).map(([label, group]) => (
                <div className="notifications-group" key={label}>
                  <div className="notifications-group-title">{label}</div>
                  <div className="notifications-list">
                    {group.map((item) => (
                      <div
                        key={item.id}
                        className={`notification-item ${item.is_read ? "read" : "unread"}`}
                      >
                        <div className="notification-time">
                          {new Date(item.created_at).toLocaleTimeString()}
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
                                className={processingIds.has(item.id) ? "is-loading" : ""}
                                disabled={processingIds.has(item.id)}
                                onClick={() =>
                                  handleAction(
                                    item.id,
                                    "confirm",
                                    item.payload?.student_id,
                                    item.payload?.tutor_id,
                                  )
                                }
                              >
                                Принять
                                <span className="loader" />
                              </button>
                              <button
                                type="button"
                                className={processingIds.has(item.id) ? "is-loading" : ""}
                                disabled={processingIds.has(item.id)}
                                onClick={() => {
                                  setDeclineId(item.id);
                                  setDeclineReason("");
                                  setError("");
                                }}
                              >
                                Отклонить
                                <span className="loader" />
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
                                      className={processingIds.has(item.id) ? "is-loading" : ""}
                                      disabled={processingIds.has(item.id)}
                                      onClick={() =>
                                        handleAction(
                                          item.id,
                                          "decline",
                                          item.payload?.student_id,
                                          item.payload?.tutor_id,
                                          declineReason,
                                        )
                                      }
                                    >
                                      Отправить
                                      <span className="loader" />
                                    </button>
                                    <button
                                      type="button"
                                      className={processingIds.has(item.id) ? "is-loading" : ""}
                                      disabled={processingIds.has(item.id)}
                                      onClick={() => {
                                        setDeclineId(null);
                                        setDeclineReason("");
                                      }}
                                    >
                                      Отмена
                                      <span className="loader" />
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
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
