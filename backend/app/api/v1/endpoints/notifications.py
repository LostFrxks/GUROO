from datetime import timedelta, time
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.time import now as now_time
from app.db.session import get_db
from app.models.tutor import Notification, TutorProfile, TutorStudent
from app.models.user import User, UserRole
from app.schemas.notification import NotificationList

router = APIRouter()

TIMEZONE = ZoneInfo("Asia/Bishkek")
RSVP_OPEN_TIME = time(8, 0)

DAY_RU = {
    "Monday": "Понедельник",
    "Tuesday": "Вторник",
    "Wednesday": "Среда",
    "Thursday": "Четверг",
    "Friday": "Пятница",
    "Saturday": "Суббота",
    "Sunday": "Воскресенье",
}

LESSON_TIMES = {
    "1": "08:00-09:20",
    "2": "09:30-10:50",
    "3": "11:40-13:00",
    "4": "13:10-14:30",
    "5": "14:40-16:00",
    "6": "16:00-17:20",
    "7": "17:30-19:00",
}


def _notification_reminder_keys(notifications: list[Notification]) -> set[tuple[int, str]]:
    keys: set[tuple[int, str]] = set()
    for notification in notifications:
        if notification.notification_type != "lesson_reminder":
            continue
        payload = notification.payload or {}
        tutor_id = payload.get("tutor_id")
        date = payload.get("date")
        if isinstance(tutor_id, int) and isinstance(date, str):
            keys.add((tutor_id, date))
    return keys


@router.get("/", response_model=NotificationList)
async def list_notifications(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()

    if current_user.role == UserRole.student:
        now = now_time(request)
        if now.time() >= RSVP_OPEN_TIME:
            target_date = now.date() + timedelta(days=1)
            existing_keys = _notification_reminder_keys(notifications)
            relations_result = await db.execute(
                select(TutorStudent, TutorProfile, User)
                .join(TutorProfile, TutorProfile.id == TutorStudent.tutor_id)
                .join(User, User.id == TutorProfile.user_id)
                .where(TutorStudent.student_id == current_user.id)
                .where(TutorStudent.confirmed == True)  # noqa: E712
            )
            new_created = False
            target_key_date = target_date.isoformat()
            day_en = target_date.strftime("%A")
            day_ru = DAY_RU.get(day_en, day_en)
            for relation, tutor_profile, tutor_user in relations_result.all():
                schedule = tutor_profile.schedule or {}
                pairs: list[str] = []
                locations: list[str] = []
                if isinstance(schedule, list):
                    for entry in schedule:
                        if str(entry.get("day")) not in {day_ru, day_en}:
                            continue
                        pair = str(entry.get("pair", ""))
                        if not pair:
                            continue
                        pairs.append(pair)
                        locations.append(str(entry.get("location") or ""))
                else:
                    pairs = schedule.get(day_ru) or schedule.get(day_en) or []
                if not pairs:
                    continue
                if (tutor_profile.id, target_key_date) in existing_keys:
                    continue
                times = [LESSON_TIMES.get(str(pair), str(pair)) for pair in pairs]
                location = ""
                if locations:
                    unique_locations = [loc for loc in dict.fromkeys(locations) if loc]
                    if unique_locations:
                        location = "; ".join(unique_locations)
                if not location:
                    location = tutor_profile.last_lesson_location or "уточните у тьютора"
                message = (
                    f"⏰ Завтра занятие с тьютором {tutor_user.first_name} {tutor_user.last_name}. "
                    f"Время: {', '.join(times)}. Кабинет: {location}."
                )
                db.add(
                    Notification(
                        user_id=current_user.id,
                        message=message,
                        notification_type="lesson_reminder",
                        payload={"tutor_id": tutor_profile.id, "date": target_key_date},
                    )
                )
                new_created = True
            if new_created:
                await db.commit()
                refreshed = await db.execute(
                    select(Notification)
                    .where(Notification.user_id == current_user.id)
                    .order_by(Notification.created_at.desc())
                )
                notifications = refreshed.scalars().all()

    return {"notifications": notifications}


@router.get("", response_model=NotificationList, include_in_schema=False)
async def list_notifications_no_slash(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_notifications(request=request, current_user=current_user, db=db)


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    return {"success": True}


@router.post("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"success": True}
