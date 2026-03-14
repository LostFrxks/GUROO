from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    group: str | None = None
    telegram_id: int | None = None
    role: UserRole
    hide_payment_notice: bool = False


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True
