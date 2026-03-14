import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.tutor import InviteStatus, TutorInviteToken
from app.models.user import User

router = APIRouter()


def _require_bot_admin_key(request: Request) -> None:
    expected = settings.bot_admin_key
    if not expected:
        return
    provided = request.headers.get("X-Bot-Admin-Key")
    if not provided or provided != expected:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/check-user")
async def check_user_registration(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == user_id))
    user = result.scalar_one_or_none()
    return {"registered": user is not None}


@router.post("/invite-token")
async def create_or_get_invite_token(payload: dict, db: AsyncSession = Depends(get_db)):
    telegram_id = payload.get("telegram_id")
    if not telegram_id:
        raise HTTPException(status_code=400, detail="telegram_id required")

    # One-time issuance: if a link/token was ever created for this telegram_id,
    # do not issue a second one (protects against fake tutors re-registering).
    existing = await db.execute(
        select(TutorInviteToken).where(TutorInviteToken.telegram_id == telegram_id).limit(1)
    )
    token = existing.scalars().first()
    if token:
        raise HTTPException(status_code=409, detail="Invite link already issued")

    new_token = TutorInviteToken(
        token=secrets.token_urlsafe(24),
        telegram_id=telegram_id,
        status=InviteStatus.unused,
    )
    db.add(new_token)
    await db.commit()
    await db.refresh(new_token)
    return {"token": new_token.token, "status": new_token.status}


@router.post("/reset-invite")
async def reset_invite_token(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    _require_bot_admin_key(request)

    telegram_id = payload.get("telegram_id")
    if telegram_id is None:
        raise HTTPException(status_code=400, detail="telegram_id required")

    try:
        telegram_id_int = int(telegram_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="telegram_id must be int") from exc

    result = await db.execute(delete(TutorInviteToken).where(TutorInviteToken.telegram_id == telegram_id_int))
    await db.commit()
    return {"deleted": int(result.rowcount or 0)}


@router.post("/reset-invites-all")
async def reset_all_invites(request: Request, db: AsyncSession = Depends(get_db)):
    _require_bot_admin_key(request)
    result = await db.execute(delete(TutorInviteToken))
    await db.commit()
    return {"deleted": int(result.rowcount or 0)}
