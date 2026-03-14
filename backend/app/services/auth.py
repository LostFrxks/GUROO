from datetime import datetime, timedelta, timezone
import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.tutor import EmailVerification
from app.models.user import User, UserRole


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    first_name: str | None = None,
    last_name: str | None = None,
    group: str | None = None,
    role: UserRole = UserRole.student,
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        group=group,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def create_email_verification(db: AsyncSession, email: str) -> EmailVerification:
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    record = EmailVerification(email=email, code=code, expires_at=expires_at, is_used=False)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def verify_email_code(db: AsyncSession, email: str, code: str) -> bool:
    result = await db.execute(
        select(EmailVerification)
        .where(EmailVerification.email == email)
        .where(EmailVerification.code == code)
        .where(EmailVerification.is_used == False)  # noqa: E712
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    if record.expires_at < datetime.now(timezone.utc):
        return False
    record.is_used = True
    await db.commit()
    return True
