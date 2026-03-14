from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    message: str
    notification_type: str
    payload: dict | None = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationList(BaseModel):
    notifications: list[NotificationOut]
