import enum
from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    student = "student"
    tutor = "tutor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    first_name = Column(String(64), nullable=True)
    last_name = Column(String(64), nullable=True)
    group = Column(String(64), nullable=True)

    telegram_id = Column(BigInteger, unique=True, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    hide_payment_notice = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tutor_profile = relationship("TutorProfile", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
