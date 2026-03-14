from datetime import datetime
from pydantic import BaseModel, constr


class TutorProfileBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    subject: str | None = None
    course: int | None = None
    own_course: int | None = None
    group: str | None = None
    bio: constr(max_length=500) | None = None
    telegram: str | None = None
    phone: str | None = None
    photo_path: str | None = None
    photo_paths: list[str] = []
    schedule: list | dict = {}
    last_lesson_topic: str | None = None
    last_lesson_location: str | None = None
    last_excel_path: str | None = None


class TutorProfileOut(TutorProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class TutorProfileUpdate(TutorProfileBase):
    schedule: list | dict | None = None


class TutorProfileUpdateRequest(BaseModel):
    profile: TutorProfileUpdate


class TutorListItem(BaseModel):
    id: int
    user_id: int
    name: str
    subject: str | None = None
    bio: str | None = None
    photo_path: str | None = None
    photo_paths: list[str] = []
    schedule: list | dict = {}
    course: int | None = None
    phone: str | None = None
    telegram: str | None = None
    group: str | None = None
    own_course: int | None = None
    request_status: str | None = None
    attended: bool = False
    cooldown_until: datetime | None = None


class TutorRequestCreate(BaseModel):
    tutor_id: int


class LessonDetailsUpdate(BaseModel):
    tutor_id: int
    topic: str
    location: str


class AttendanceSubmit(BaseModel):
    tutor_id: int


class LessonAttendanceUpdate(BaseModel):
    student_ids: list[int]
    topic: str
    location: str


class TutorScheduleEntry(BaseModel):
    day: str
    time: str
    can_mark: bool


class TutorScheduleWithAttendance(BaseModel):
    tutor_id: int
    tutor_name: str
    subject: str | None = None
    schedule: list[TutorScheduleEntry]
    already_marked: bool


class TutorScheduleResponse(BaseModel):
    schedule: list[TutorScheduleWithAttendance]
