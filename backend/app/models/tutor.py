import enum
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base


class InviteStatus(str, enum.Enum):
    unused = "unused"
    used = "used"


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    first_name = Column(String(64), nullable=True)
    last_name = Column(String(64), nullable=True)

    subject = Column(String(255), nullable=True)
    course = Column(Integer, nullable=True)
    own_course = Column(Integer, nullable=True)
    group = Column(String(64), nullable=True)
    bio = Column(String, nullable=True)

    telegram = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)

    photo_path = Column(String(255), nullable=True)
    photo_paths = Column(JSON, nullable=False, default=list)
    schedule = Column(JSON, nullable=False, default=dict)

    last_lesson_topic = Column(String(255), nullable=True)
    last_lesson_location = Column(String(255), nullable=True)
    excel_generated = Column(Boolean, default=False, nullable=False)
    last_excel_path = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="tutor_profile")
    students = relationship("TutorStudent", back_populates="tutor", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="tutor", cascade="all, delete-orphan")


class TutorStudent(Base):
    __tablename__ = "tutor_students"
    __table_args__ = (UniqueConstraint("tutor_id", "student_id", name="uq_tutor_student"),)

    id = Column(Integer, primary_key=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    confirmed = Column(Boolean, default=False, nullable=False)
    attended = Column(Boolean, default=False, nullable=False)
    attendance_time = Column(DateTime(timezone=True), nullable=True)
    topic = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    declined_until = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tutor = relationship("TutorProfile", back_populates="students")
    student = relationship("User")


class TutorInviteToken(Base):
    __tablename__ = "tutor_invite_tokens"

    id = Column(Integer, primary_key=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    telegram_id = Column(Integer, nullable=True)
    status = Column(Enum(InviteStatus), default=InviteStatus.unused, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    message = Column(String(512), nullable=False)
    notification_type = Column(String(64), nullable=False, default="general")
    payload = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), index=True, nullable=False)
    code = Column(String(8), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
