from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.session import get_db
from app.models.tutor import InviteStatus, TutorInviteToken, TutorProfile
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenPair, TutorRegisterRequest
from app.schemas.user import UserOut
from app.services.auth import authenticate_user, create_email_verification, create_user, verify_email_code
from app.services.email import send_email

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/send-code")
async def send_verification_code(payload: dict, db: AsyncSession = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    record = await create_email_verification(db, email)
    send_email("Verification code", f"Your code: {record.code}", email)
    if settings.app_env == "dev":
        logger.info("Email verification code for %s: %s", email, record.code)
    return {"success": True}


@router.post("/verify-code")
async def verify_code(payload: dict, db: AsyncSession = Depends(get_db)):
    email = payload.get("email")
    code = payload.get("code")
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code required")
    ok = await verify_email_code(db, email, str(code))
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid code")
    return {"success": True}


@router.post("/register", response_model=UserOut)
async def register_student(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await create_user(
        db=db,
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        group=payload.group,
        role=UserRole.student,
    )
    return user


@router.post("/tutor-register", response_model=UserOut)
async def register_tutor(payload: TutorRegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    token_result = await db.execute(
        select(TutorInviteToken).where(
            TutorInviteToken.token == payload.token,
            TutorInviteToken.status == InviteStatus.unused,
        )
    )
    token = token_result.scalar_one_or_none()
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or used token")
    if token.telegram_id is None:
        raise HTTPException(status_code=400, detail="Invite token has no telegram_id")

    user = await create_user(
        db=db,
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        group=payload.group,
        role=UserRole.tutor,
    )
    user.telegram_id = token.telegram_id

    profile = TutorProfile(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        group=payload.group,
        own_course=payload.course,
        subject="",
        schedule={},
    )
    db.add(profile)

    token.status = InviteStatus.used
    token.used_at = func.now()
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
    )
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    try:
        claims = decode_token(refresh_token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    user_id = claims.get("sub")
    access_token = create_access_token(str(user_id))
    new_refresh = create_refresh_token(str(user_id))
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
    )
    return TokenPair(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"success": True}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if "hide_payment_notice" in payload:
        current_user.hide_payment_notice = bool(payload["hide_payment_notice"])
    await db.commit()
    await db.refresh(current_user)
    return current_user
