from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import Request

from app.core.config import settings


TIMEZONE = ZoneInfo("Asia/Bishkek")


def now(request: Request | None = None) -> datetime:
    """
    Current time helper.

    In dev, supports overriding time for testing via `X-Debug-Now` header
    with an ISO datetime string, e.g. `2026-01-28T08:05:00+06:00`.
    """
    if settings.app_env == "dev" and request is not None:
        raw = request.headers.get("X-Debug-Now")
        if raw:
            try:
                override = datetime.fromisoformat(raw)
            except ValueError:
                override = None
            if override is not None:
                if override.tzinfo is None:
                    return override.replace(tzinfo=TIMEZONE)
                return override.astimezone(TIMEZONE)
    return datetime.now(tz=TIMEZONE)
