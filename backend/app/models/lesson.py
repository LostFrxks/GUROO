import enum
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class EnrollmentStatus(str, enum.Enum):
    requested = "requested"
    tutor_accepted = "tutor_accepted"
    tutor_declined = "tutor_declined"
    student_confirmed = "student_confirmed"
    student_declined = "student_declined"
    canceled = "canceled"


class AttendanceStatus(str, enum.Enum):
    unmarked = "unmarked"
    present = "present"
    absent = "absent"


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("tutor_id", "lesson_date", "slot_id", name="uq_tutor_lesson"),)

    id = Column(Integer, primary_key=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False)

    lesson_date = Column(Date, nullable=False)
    slot_id = Column(String(2), nullable=False)

    topic = Column(String(255), nullable=True)
    location = Column(String(64), nullable=True)

    attendance_finalized = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tutor = relationship("TutorProfile", back_populates="lessons")
    enrollments = relationship(
        "LessonEnrollment",
        back_populates="lesson",
        cascade="all, delete-orphan",
    )


class LessonEnrollment(Base):
    __tablename__ = "lesson_enrollments"
    __table_args__ = (UniqueConstraint("lesson_id", "student_id", name="uq_lesson_student"),)

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.requested, nullable=False)
    decline_reason = Column(Text, nullable=True)

    attendance_status = Column(Enum(AttendanceStatus), default=AttendanceStatus.unmarked, nullable=False)
    attendance_marked_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lesson = relationship("Lesson", back_populates="enrollments")
    student = relationship("User")


class ExamScore(Base):
    __tablename__ = "exam_scores"
    __table_args__ = (UniqueConstraint("tutor_id", "student_id", "subject", name="uq_exam_score"),)

    id = Column(Integer, primary_key=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    subject = Column(String(255), nullable=True)
    midterm1 = Column(Integer, nullable=True)
    midterm2 = Column(Integer, nullable=True)
    final = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tutor = relationship("TutorProfile")
    student = relationship("User")
