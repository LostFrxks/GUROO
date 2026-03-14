from fastapi import APIRouter

from app.api.v1.endpoints import auth, tutors, notifications, health, bot, lessons

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tutors.router, prefix="/tutors", tags=["tutors"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(bot.router, prefix="/bot", tags=["bot"])
