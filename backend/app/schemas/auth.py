from pydantic import BaseModel, EmailStr


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    group: str | None = None
    course: int | None = None
    password: str


class TutorRegisterRequest(BaseModel):
    token: str
    first_name: str
    last_name: str
    group: str | None = None
    course: int | None = None
    email: EmailStr
    password: str
