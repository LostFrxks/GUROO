export const SESSION_EXPIRED_EVENT = "guroo:session-expired";
const DEBUG_TIME_KEY = "guroo:test-time";
const ENABLE_TIME_TRAVEL = import.meta.env.VITE_ENABLE_TIME_TRAVEL === "true";

type ApiFetchInit = RequestInit & {
  _skipSessionHandling?: boolean;
};

let sessionExpiredEmittedAt = 0;

export async function apiRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data?.access_token) {
      sessionStorage.setItem("access_token", data.access_token);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function apiLogout(): Promise<void> {
  sessionStorage.removeItem("access_token");
  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  } catch {
    // ignore
  }
}

export async function apiFetch(path: string, options: ApiFetchInit = {}) {
  const token = sessionStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (ENABLE_TIME_TRAVEL) {
    const debugNow = localStorage.getItem(DEBUG_TIME_KEY);
    if (debugNow) {
      headers["X-Debug-Now"] = debugNow;
    }
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !options._skipSessionHandling) {
    const now = Date.now();
    if (now - sessionExpiredEmittedAt > 1500) {
      sessionExpiredEmittedAt = now;
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
  }

  return response;
}
