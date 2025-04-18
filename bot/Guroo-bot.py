import pymysql
import secrets
import logging
import asyncio
import requests  # 📌 Для запросов к Django API
from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.enums import ChatMemberStatus
from aiogram.types import ChatMember


# 🔐 Настройки
TOKEN = "7961799288:AAHuDweWsXvyHR05aumNNhztz2bwd-O3xcs"
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "root"
DB_NAME = "tutor_project"
BOT_USERNAME = "GFive_Guroo_bot"
GROUP_ID = -1002569023276

LOCAL_IP = "172.19.227.124"
DJANGO_API = f"http://{LOCAL_IP}:8000/"

# 📌 Логирование
logging.basicConfig(level=logging.INFO)

# 🔌 Подключение к боту
bot = Bot(token=TOKEN)
dp = Dispatcher()

# 📌 Подключение к базе данных
def get_connection():
    return pymysql.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=DB_NAME, charset="utf8mb4"
    )

# ✅ Проверка регистрации пользователя
def is_user_registered(telegram_id):
    print(f"Запрос к API: {DJANGO_API}check_user_registration/?user_id={telegram_id}")
    response = requests.get(f"{DJANGO_API}check_user_registration/?user_id={telegram_id}")
    data = response.json()
    return data.get("registered", False)

# ✅ Проверка, выдавалась ли ссылка этому пользователю
def get_unused_link(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Проверяем, есть ли уже активная ссылка
    cursor.execute("SELECT token FROM tutor_app_tokens WHERE user_id = %s AND status = 'unused'", (user_id,))
    row = cursor.fetchone()

    if row:
        token = row[0]
        link = f"http://{LOCAL_IP}:8000/tutor_signup/{token}/"
        return link

    # Если нет — создаём новую
    token = secrets.token_urlsafe(24)
    link = f"http://{LOCAL_IP}:8000/tutor_signup/{token}/"

    cursor.execute(
        "INSERT INTO tutor_app_tokens (token, link, user_id, status) VALUES (%s, %s, %s, 'unused')",
        (token, link, user_id)
    )
    conn.commit()
    return link

@dp.message(lambda message: message.text == "/checkme")
async def check_user_in_group(message: types.Message):
    user_id = message.from_user.id
    try:
        member = await bot.get_chat_member(GROUP_ID, user_id)
        await message.reply(f"✅ Твой статус в группе: {member.status}")
    except Exception as e:
        await message.reply(f"❌ Ошибка проверки: {e}")


async def is_user_in_group(user_id):
    """ Проверяет, состоит ли пользователь в группе """
    try:
        member = await bot.get_chat_member(GROUP_ID, user_id)
        logging.info(f"📌 Статус пользователя {user_id} в группе: {member.status}")  # ✅ Логируем статус
        
        # ✅ Проверка статусов без ChatMemberStatus
        return member.status in ["member", "administrator", "creator"]
    except Exception as e:
        logging.error(f"Ошибка проверки группы: {e}")
        return False

@dp.message(lambda message: message.chat.type == "private" and message.text == "/start")
async def send_link_to_user(message: types.Message):
    user_id = message.from_user.id

    # ✅ Проверка, состоит ли пользователь в группе
    if not await is_user_in_group(user_id):
        await message.reply("⛔ Доступ запрещен! Вам нужно сначала вступить в нашу группу.")
        return

    if is_user_registered(user_id):
        await message.reply("Вы уже зарегистрированы! 🎓")
        return

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT link FROM tutor_app_tokens WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()

    if row:
        link = row[0]
        await message.reply(f"🎓 Вы уже получили ссылку на регистрацию!\nИспользуйте её, чтобы завершить процесс: {link}")
    else:
        link = get_unused_link(user_id)
        await message.reply(
            f"🎓 Привет, {message.from_user.full_name}!\nВот твоя уникальная ссылка для регистрации: {link}",
            protect_content=True  # 🔒 Защита от пересылки
        )

    conn.close()

# ✅ Отслеживание новых участников в супергруппе
@dp.chat_member()
async def track_new_members(update: types.ChatMemberUpdated):
    logging.info(f"🔍 Новое событие в группе: {update}")

    if update.new_chat_member.status == ChatMemberStatus.MEMBER:  # Проверяем, добавили ли нового участника
        user_id = update.new_chat_member.user.id
        first_name = update.new_chat_member.user.first_name
        mention = f"[{first_name}](tg://user?id={user_id})"

        logging.info(f"✅ Новый участник: {first_name} (ID: {user_id})")

        # ✅ Исправлено: корректный формат клавиатуры
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Перейти в бота 🤖", url=f"https://t.me/{BOT_USERNAME}?start=start")]
        ])

        await bot.send_message(
            update.chat.id,
            f"🎓 Добро пожаловать, {mention}! Чтобы зарегистрироваться, нажмите кнопку ниже 👇",
            parse_mode="Markdown",
            reply_markup=keyboard
        )

# ✅ Запуск бота
async def main():
    logging.info("🚀 Бот запущен и слушает события...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    for user_id in range(1011+15, 1016+15):  # Пример для 10 пользователей с ID от 1 до 10
        link = get_unused_link(user_id)
        print(link)

    asyncio.run(main())
