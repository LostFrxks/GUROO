import asyncio
import logging
import os
import time

import httpx
from aiogram import Bot, Dispatcher, F, Router, types
from aiogram.enums import ChatMemberStatus
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
BOT_USERNAME = os.getenv("BOT_USERNAME", "GFive_Guroo_bot").strip()
GROUP_ID = int(os.getenv("BOT_GROUP_ID", "0"))
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8001").rstrip("/")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
CHECK_GROUP = os.getenv("CHECK_GROUP", "true").lower() in {"1", "true", "yes", "y"}
GROUP_INVITE_URL = os.getenv("GROUP_INVITE_URL", "").strip()

START_COOLDOWN_SECONDS = int(os.getenv("START_COOLDOWN_SECONDS", "20"))
API_TIMEOUT = float(os.getenv("API_TIMEOUT", "8"))
API_RETRIES = int(os.getenv("API_RETRIES", "2"))
BACKEND_ADMIN_KEY = os.getenv("BOT_BACKEND_ADMIN_KEY", os.getenv("BOT_ADMIN_KEY", "")).strip()
ENABLE_DEBUG_COMMANDS = os.getenv("BOT_ENABLE_DEBUG_COMMANDS", "true").lower() in {"1", "true", "yes", "y"}
BOT_ADMIN_IDS = {
    int(value.strip())
    for value in os.getenv("BOT_ADMIN_IDS", "").split(",")
    if value.strip().isdigit()
}

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is required")

logging.basicConfig(level=os.getenv("BOT_LOG_LEVEL", "INFO").upper())
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
router = Router()
dp.include_router(router)

stats = {
    "start_calls": 0,
    "verify_clicks": 0,
    "links_sent": 0,
    "api_errors": 0,
}
last_verify_click = {}


async def api_request(method: str, path: str, payload: dict | None = None, params: dict | None = None) -> dict:
    url = f"{API_BASE_URL}{path}"
    attempts = API_RETRIES + 1
    last_error: Exception | None = None

    for _ in range(attempts):
        try:
            async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
                response = await client.request(method, url, json=payload, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            if status_code is not None and 400 <= status_code < 500:
                raise
            last_error = exc
            await asyncio.sleep(0.3)
        except Exception as exc:
            last_error = exc
            await asyncio.sleep(0.3)

    stats["api_errors"] += 1
    raise last_error or RuntimeError("API request failed")


async def api_get(path: str, params: dict | None = None) -> dict:
    return await api_request("GET", path, params=params)


async def api_post(path: str, payload: dict) -> dict:
    return await api_request("POST", path, payload=payload)


async def api_post_admin(path: str, payload: dict) -> dict:
    if not BACKEND_ADMIN_KEY:
        return await api_post(path, payload)
    url = f"{API_BASE_URL}{path}"
    async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
        response = await client.post(url, json=payload, headers={"X-Bot-Admin-Key": BACKEND_ADMIN_KEY})
        response.raise_for_status()
        return response.json()


async def is_user_in_group(user_id: int) -> bool:
    if not CHECK_GROUP or GROUP_ID == 0:
        return True
    try:
        member = await bot.get_chat_member(GROUP_ID, user_id)
        return member.status in {"member", "administrator", "creator"}
    except Exception as exc:
        logger.error("Group check failed: %s", exc)
        return False


def hit_cooldown(user_id: int) -> int:
    now = time.monotonic()
    last_time = last_verify_click.get(user_id, 0.0)
    delta = now - last_time
    if delta < START_COOLDOWN_SECONDS:
        return int(START_COOLDOWN_SECONDS - delta)
    last_verify_click[user_id] = now
    return 0


def verify_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Проверить доступ", callback_data="verify_access")]]
    )


def group_invite_keyboard() -> InlineKeyboardMarkup | None:
    if not GROUP_INVITE_URL:
        return None
    if GROUP_INVITE_URL.startswith("http://") or GROUP_INVITE_URL.startswith("https://"):
        return InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="Вступить в группу", url=GROUP_INVITE_URL)]]
        )
    return None


def is_public_url(url: str) -> bool:
    return url.startswith("https://") or url.startswith("http://")


async def send_registration_link(chat_id: int, full_name: str, user_id: int) -> None:
    try:
        check = await api_get("/api/v1/bot/check-user", {"user_id": user_id})
    except Exception as exc:
        logger.error("Check user failed: %s", exc)
        await bot.send_message(chat_id, "Не удалось проверить регистрацию. Попробуйте позже.")
        return

    if check.get("registered"):
        await bot.send_message(chat_id, "Вы уже зарегистрированы 🎓")
        return

    try:
        invite = await api_post("/api/v1/bot/invite-token", {"telegram_id": user_id})
    except httpx.HTTPStatusError as exc:
        if exc.response is not None and exc.response.status_code == 409:
            await bot.send_message(
                chat_id,
                "Ссылка уже выдавалась ранее и повторно не выдается.\n"
                "Если вы тьютор и потеряли ссылку — напишите декану.",
            )
            return
        logger.error("Invite token failed: %s", exc)
        await bot.send_message(chat_id, "Не удалось создать ссылку. Попробуйте позже.")
        return
    except Exception as exc:
        logger.error("Invite token failed: %s", exc)
        await bot.send_message(chat_id, "Не удалось создать ссылку. Попробуйте позже.")
        return

    token = invite.get("token")
    if not token:
        await bot.send_message(chat_id, "Не удалось получить токен. Попробуйте позже.")
        return

    link = f"{FRONTEND_BASE_URL}/tutor-signup/{token}"
    stats["links_sent"] += 1
    logger.info("Invite link for %s (%s): %s", full_name, user_id, link)

    if is_public_url(link) and "localhost" not in link and "127.0.0.1" not in link:
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="Открыть ссылку", url=link)]]
        )
        await bot.send_message(
            chat_id,
            f"Привет, {full_name}!\nВот ваша ссылка для регистрации: {link}",
            disable_web_page_preview=True,
            protect_content=False,
            reply_markup=keyboard,
        )
        return

    await bot.send_message(
        chat_id,
        "Привет! Ссылка для регистрации отправлена в логи бота (локальный режим).",
    )


@router.message(Command("start"), F.chat.type == "private")
async def start(message: types.Message):
    stats["start_calls"] += 1
    await message.reply(
        "Нажмите кнопку ниже, чтобы проверить доступ и получить ссылку на регистрацию.\n"
        "Ссылка выдаётся только тьюторам (по наличию в группе) и только один раз.",
        reply_markup=verify_keyboard(),
    )


@router.message(Command("link"), F.chat.type == "private")
async def link(message: types.Message):
    await start(message)


@router.message(Command("force_link"), F.chat.type == "private")
async def force_link(message: types.Message):
    user_id = message.from_user.id
    try:
        invite = await api_post("/api/v1/bot/invite-token", {"telegram_id": user_id})
    except httpx.HTTPStatusError as exc:
        if exc.response is not None and exc.response.status_code == 409:
            await message.reply("Ссылка уже выдавалась. Сначала /reset_invite me")
            return
        logger.error("force_link failed: %s", exc)
        await message.reply("Не удалось получить ссылку. Попробуйте позже.")
        return
    except Exception as exc:
        logger.error("force_link failed: %s", exc)
        await message.reply("Не удалось получить ссылку. Попробуйте позже.")
        return

    token = invite.get("token")
    if not token:
        await message.reply("Не удалось получить токен.")
        return

    link = f"{FRONTEND_BASE_URL}/tutor-signup/{token}"
    logger.info("Force invite link for %s (%s): %s", message.from_user.full_name, user_id, link)
    await message.reply(f"Тестовая ссылка: {link}")


@router.callback_query(F.data == "verify_access")
async def verify_access(callback: types.CallbackQuery):
    stats["verify_clicks"] += 1
    await callback.answer()

    user_id = callback.from_user.id
    wait_left = hit_cooldown(user_id)
    if wait_left > 0:
        await bot.send_message(callback.message.chat.id, f"Подожди {wait_left} сек. и попробуй снова.")
        return

    if not await is_user_in_group(user_id):
        keyboard = group_invite_keyboard()
        if keyboard is not None:
            await bot.send_message(
                callback.message.chat.id,
                "Доступ запрещён. Сначала вступите в группу тьюторов.",
                reply_markup=keyboard,
            )
        else:
            await bot.send_message(
                callback.message.chat.id,
                "Доступ запрещён. Сначала вступите в группу тьюторов.",
            )
        return

    await send_registration_link(callback.message.chat.id, callback.from_user.full_name, user_id)


@router.message(Command("checkme"))
async def checkme(message: types.Message):
    if not ENABLE_DEBUG_COMMANDS and message.from_user.id not in BOT_ADMIN_IDS:
        await message.reply("Команда отключена.")
        return
    user_id = message.from_user.id
    try:
        member = await bot.get_chat_member(GROUP_ID, user_id)
        await message.reply(f"Твой статус в группе: {member.status}")
    except Exception as exc:
        await message.reply(f"Ошибка проверки: {exc}")


@router.message(Command("whoami"))
async def whoami(message: types.Message):
    if not ENABLE_DEBUG_COMMANDS and message.from_user.id not in BOT_ADMIN_IDS:
        await message.reply("Команда отключена.")
        return
    user = message.from_user
    await message.reply(f"id: {user.id}\nusername: @{user.username}\nname: {user.full_name}")


@router.message(Command("ping"))
async def ping(message: types.Message):
    if not ENABLE_DEBUG_COMMANDS and message.from_user.id not in BOT_ADMIN_IDS:
        await message.reply("Команда отключена.")
        return
    await message.reply("pong")


@router.message(Command("stats"))
async def bot_stats(message: types.Message):
    if BOT_ADMIN_IDS and message.from_user.id not in BOT_ADMIN_IDS:
        await message.reply("Нет доступа.")
        return
    await message.reply(
        "Bot stats:\n"
        f"start_calls: {stats['start_calls']}\n"
        f"verify_clicks: {stats['verify_clicks']}\n"
        f"links_sent: {stats['links_sent']}\n"
        f"api_errors: {stats['api_errors']}"
    )


@router.message(Command("reset_invite"))
async def reset_invite(message: types.Message):
    parts = (message.text or "").split()
    if len(parts) < 2:
        await message.reply("Использование: /reset_invite <telegram_id|me>")
        return

    raw = parts[1].strip().lower()
    telegram_id = message.from_user.id if raw == "me" else raw

    try:
        telegram_id_int = int(telegram_id)
    except Exception:
        await message.reply("telegram_id должен быть числом (или me).")
        return

    try:
        result = await api_post_admin("/api/v1/bot/reset-invite", {"telegram_id": telegram_id_int})
    except Exception as exc:
        logger.error("reset-invite failed: %s", exc)
        await message.reply("Не удалось сбросить. Проверь BOT_BACKEND_ADMIN_KEY и доступ к API.")
        return

    await message.reply(f"Сбросил: удалено записей {result.get('deleted', 0)}")


@router.message(Command("reset_invites_all"))
async def reset_invites_all(message: types.Message):
    try:
        result = await api_post_admin("/api/v1/bot/reset-invites-all", {})
    except Exception as exc:
        logger.error("reset-invites-all failed: %s", exc)
        await message.reply("Не удалось сбросить все записи. Проверь ключ и API.")
        return

    await message.reply(f"Полный сброс: удалено записей {result.get('deleted', 0)}")


@router.chat_member()
async def track_new_members(update: types.ChatMemberUpdated):
    if not BOT_USERNAME:
        return
    if update.new_chat_member.status == ChatMemberStatus.MEMBER:
        first_name = update.new_chat_member.user.first_name
        user_id = update.new_chat_member.user.id
        mention = f"[{first_name}](tg://user?id={user_id})"

        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="Перейти в бота 🤖",
                        url=f"https://t.me/{BOT_USERNAME}?start=start",
                    )
                ]
            ]
        )

        await bot.send_message(
            update.chat.id,
            f"🎓 Добро пожаловать, {mention}! Чтобы зарегистрироваться, нажмите кнопку ниже 👇",
            parse_mode="Markdown",
            reply_markup=keyboard,
        )


async def main():
    logger.info("Бот запущен и слушает события...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
