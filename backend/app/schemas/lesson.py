from datetime import date
from pydantic import BaseModel, Field

from app.models.lesson import AttendanceStatus, EnrollmentStatus


class LessonRequestCreate(BaseModel):
    tutor_id: int
    lesson_date: date
    slot_id: str = Field(..., min_length=1, max_length=2)


class LessonRequestResponse(BaseModel):
    enrollment_id: int
    status: EnrollmentStatus
    payment_notice: bool = False


class TutorDecision(BaseModel):
    reason: str | None = None


class StudentRsvp(BaseModel):
    will_attend: bool


class AttendanceUpdate(BaseModel):
    present_student_ids: list[int]


class LessonDetailsUpdate(BaseModel):
    topic: str
    location: str


class EnrollmentStudent(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    group: str | None = None

    class Config:
        from_attributes = True


class LessonEnrollmentOut(BaseModel):
    id: int
    status: EnrollmentStatus
    decline_reason: str | None = None
    attendance_status: AttendanceStatus
    student: EnrollmentStudent

    class Config:
        from_attributes = True


class LessonOut(BaseModel):
    id: int
    tutor_id: int
    lesson_date: date
    slot_id: str
    topic: str | None = None
    location: str | None = None
    enrollments: list[LessonEnrollmentOut] = []

    class Config:
        from_attributes = True


class StudentLessonItem(BaseModel):
    id: int
    tutor_id: int
    tutor_name: str
    subject: str | None = None
    lesson_date: date
    slot_id: str
    status: EnrollmentStatus
    decline_reason: str | None = None
    attendance_status: AttendanceStatus
    topic: str | None = None
    location: str | None = None

    class Config:
        from_attributes = True


class TutorLessonItem(BaseModel):
    id: int
    lesson_date: date
    slot_id: str
    topic: str | None = None
    location: str | None = None
    enrollments: list[LessonEnrollmentOut] = []

    class Config:
        from_attributes = True
