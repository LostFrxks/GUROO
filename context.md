Guroo — веб‑проект для подбора и управления тьюторами/тьюти с упором на AUCA/TSI AUCA.
Проект содержит Django‑бекенд, фронтенд на шаблонах + статические JS/CSS, и отдельный Telegram‑бот для выдачи ссылок на регистрацию тьюторов.

Содержание (кратко)
- Назначение: каталог тьюторов, запись студентов к тьюторам, подтверждение запросов, отметка посещаемости, уведомления и выгрузка Excel по занятиям.
- Основные роли: student и tutor (роль хранится в CustomUser).
- Интеграции: SMTP Gmail для email‑кодов, Telegram Bot (aiogram) + прямые SQL‑запросы к MySQL.

Технологии и зависимости
- Django 5.1 (проект `tutor_project`, приложение `tutor_app`).
- MySQL (`ENGINE = django.db.backends.mysql`, БД `tutor_project`).
- django_extensions (в INSTALLED_APPS).
- pymysql (прямые SQL‑запросы в views и в боте).
- openpyxl (генерация Excel).
- aiogram, requests (Telegram‑бот).

Структура репозитория
- `manage.py` — стандартный вход Django.
- `tutor_project/` — настройки проекта (settings, urls, wsgi/asgi).
- `tutor_app/` — основное приложение (models, views, urls, templates, static).
- `bot/Guroo-bot.py` — Telegram‑бот.
- `media/` — загружаемые файлы (фото тьюторов, Excel‑файлы занятий).
- `static/` — исходные статические файлы приложения (CSS/JS/картинки).
- `staticfiles/` — собранные статики (collectstatic), включая Django admin.
- `venv/` — виртуальное окружение (закоммичено в проект).

Django settings (`tutor_project/settings.py`)
- DEBUG = True, ALLOWED_HOSTS перечислены явно.
- AUTH_USER_MODEL = `tutor_app.CustomUser`.
- БД: MySQL (host=localhost, user=root, password=root, utf8mb4).
- EMAIL: SMTP Gmail, логин/пароль заданы в коде.
- STATIC_URL = /static/, STATIC_ROOT = `staticfiles/`, STATICFILES_DIRS = `tutor_app/static`.
- MEDIA_ROOT = `media/`, MEDIA_URL = /media/.
- Сессии: хранение в БД, 1 час TTL.

Маршруты верхнего уровня (`tutor_project/urls.py`)
- `admin/` — админка.
- `""` — include всех `tutor_app.urls`.
- `register/` — страница регистрации (email + код).
- `register_form/` — шаг заполнения профиля студента.
- `login/` — страница логина (шаблонная, без логики аутентификации).
- В DEBUG добавляется статика media.
- При импорте выводятся reverse‑ключи (pprint(get_resolver().reverse_dict.keys())).

Приложение `tutor_app`

Модели (`tutor_app/models.py`)
- CustomUser (на базе AbstractUser):
  - email (unique, используется как USERNAME_FIELD), telegram_id, is_tutor, role (student/tutor),
    group, first_name, last_name, profile_picture.
  - save(): если role == tutor, выставляет is_tutor.
  - get_initials(): инициалы для аватара.
- TutorProfile:
  - OneToOne с CustomUser, поля: group, telegram, phone, first_name/last_name (копии),
    subject, own_course, course, bio, last_lesson_topic, last_lesson_location,
    excel_generated, photo (default tutors_photos/def.png), schedule (JSON).
  - save(): проверка наличия имени/фамилии у пользователя; дедупликация фото по SHA‑256.
- TutorStudent:
  - связь tutor (TutorProfile) ↔ student (CustomUser), confirmed/attended,
    attendance_time, topic, location; unique_together (tutor, student).
- TutorInviteToken:
  - token (str), email, is_used, created_at, student.
- Notification:
  - user, message, timestamp, is_read.
- Signals: при создании пользователя с role=tutor создаётся TutorProfile.
- Утилиты: validate_image_extension (jpg/jpeg/png), get_file_hash (SHA‑256).

Админка (`tutor_app/admin.py`)
- CustomUserAdmin с email/role, фильтрами и поиском.
- TutorProfile и TutorStudent зарегистрированы.

Формы (`tutor_app/forms.py`)
- TutorProfileForm:
  - course (select), available_days/available_times (для UI, но не в Meta fields).
  - Meta fields: group, subject, course, bio, photo.
- generate_schedule_slots() в `tutor_app/utils.py` формирует список тайм‑слотов.

Представления и API (`tutor_app/views.py`)
Ключевые страницы:
- `/` → main_page (main.html).
- `/about/` → about_page (about.html).
- `/tutors/` → index (tutors.html).
- `/sign_in/` → user_login (AJAX‑логин).
- `/register/` → register_page (email + код).
- `/register_form/` → register_form (шаг завершения регистрации студента).
- `/edit_tutor_profile/` → edit_tutor_profile (форма профиля тьютора).
- `/tutor_signup/<token>/` → register_tutor_page (регистрация тьютора по ссылке из бота).

API/эндпойнты (используются фронтендом):
- `/get_tutors/?user_id=...` — список тьюторов (bio != пусто), плюс статус запроса и расписание.
- `/send-tutor-request/` — студент → запрос тьютору (создаёт TutorStudent и Notification).
- `/confirm-via-notification/` — тьютор подтверждает через уведомление (TutorStudent.confirmed=True).
- `/decline-tutor-request/` — тьютор отклоняет запрос (TutorStudent удаляется).
- `/get_notifications/` — список Notification для пользователя.
- `/send_acceptance_notification/` — уведомление студенту при подтверждении (отправка вручную).
- `/get_registered_tutors/?user_id=...` — список тьюторов (для студента) и студентов (для тьютора).
- `/get_tutor_schedule/?user_id=...` — расписание конкретного тьютора.
- `/get_schedule_with_attendance/` — расписание тьюторов + флаги доступности отметки.
- `/submit_attendance/` — отметить посещение (проверка времени занятия).
- `/get_my_lessons/?tutor_id=...` — список студентов тьютора + флаг show_fields + topic/location.
- `/save_lesson_details/` — сохранить тему/локацию последнего занятия.
- `/get_csrf/` — выдача CSRF токена.

Доп. эндпойнты/логика:
- `/register_tutor/<tutor_id>/<student_id>/` и `/confirm_registration/<record_id>/` — старая схема подтверждения через email.
- `/send_verification_code/` и `/verify_code/` — email‑верификация для регистрации студента.
- `/complete_registration/` — создание студента (CustomUser) и логин.
- `/complete_tutor_registration/` — создание тьютора через токен от бота.
- `/confirm-tutor/<uuid:token>/` — подтверждение запроса через TutorInviteToken.
- `/validate_token/` — API для бота (сейчас работает с `tutor_app_tutorinvitetoken` и полем status).
- `/check_user_registration/` — API для бота, проверка по telegram_id.
- `/logout/` — выход из сессии.

Важные детали логики
- Расписание тьютора хранится в JSON: ключи — русские дни недели, значения — номера пар (строки "1".."7").
- `lesson_times` в views: соответствие пары → время (08:00-19:00).
- В `get_tutor_schedule_with_attendance` и `submit_attendance` время сейчас захардкожено на
  2025‑03‑31 08:30 (для тестов), а не `datetime.now()`.
- Excel выгружается по тьюторам в `media/lessons/lesson_{tutor_id}_{timestamp}.xlsx` после истечения пары.
- Notification.message формируется с HTML‑span'ами для inline approve/decline.

Telegram‑бот (`bot/Guroo-bot.py`)
- Aiogram‑бот с проверкой, состоит ли пользователь в Telegram‑группе (`GROUP_ID`).
- `is_user_registered` вызывает Django API `/check_user_registration/`.
- `get_unused_link` использует таблицу `tutor_app_tokens` (SQL), генерирует token/link и хранит статус.
- Бот выдаёт ссылку на `/tutor_signup/<token>/`.
- Есть обработчик `/start` для ЛС и watcher новых участников группы.

Фронтенд: шаблоны и статические скрипты

Основные шаблоны:
- `main.html` — лендинг, блоки, статистика, топ‑тьюторы, футер, анимации.
- `tutors.html` — каталог тьюторов, фильтры (курс/предмет), карточки, попап тьютора.
- `header.html` — общий хедер, аватар, уведомления, попапы (профиль, расписание, уроки).
- `sign_in.html` — форма логина.
- `register.html` — шаг ввода email и верификации.
- `register_form.html` — регистрация студента.
- `register_tutor.html` — регистрация тьютора по токену.
- `edit_tutor_profile.html` — редактирование профиля и расписания.
- `about.html` — страница о команде/проекте + слайдер.
- `registration.html` — похожа на register_form (возможный дубль/legacy).

Ключевые JS:
- `tutors.js`:
  - загрузка списка тьюторов (`/get_tutors/`), рендер карточек.
  - фильтры по курсу и предметам (обширный список предметов).
  - поиск по имени, попап тьютора, отправка запроса (`/send-tutor-request/`).
  - localStorage: блокировка повторных запросов.
  - показ popup подтверждения по URL‑параметрам (?confirmed=...).
- `header.js`:
  - меню профиля (список тьюторов/студентов, "мои уроки", выход, редактирование профиля).
  - уведомления (загрузка `/get_notifications/`, inline approve/decline).
  - расписание и отметка посещаемости (`/get_schedule_with_attendance/`, `/submit_attendance/`).
  - окно "мои уроки" для тьютора с показом студентов и пары/темы/места.
- `edit_profile.js`:
  - UI для составления расписания (день недели + номер пары).
  - предотвращение дубликатов пар в один день.
  - список предметов по курсам, автодополнение.
  - валидация: telegram URL, обязательные поля, расписание.
  - POST `/edit_tutor_profile/`.
- `register.js`:
  - отправка email кода `/send_verification_code/`, проверка `/verify_code/`.
  - анимации фона.
- `register_form.js`:
  - завершение регистрации студента `/complete_registration/`.
  - валидация пароля, выбор группы по курсу.
- `sign_in.js`:
  - логин `/sign_in/` (AJAX), редирект на `/tutors/`.
- `registration_tutors.js` и `register_tutor.js`:
  - регистрация тьютора через `/complete_tutor_registration/` (FormData/JSON).
  - обработка ошибочного токена (попап).
- `about-js.js`, `main-js.js`:
  - слайдер, интро‑экран, скролл‑кнопка и фоновые анимации.
- `after_zip.js` — альтернативный скрипт для хедера/уведомлений (похож на `header.js`).

Статика и медиа
- `tutor_app/static/` содержит CSS/JS/изображения для страниц и UI.
- `staticfiles/` — собранные статики, в т.ч. `admin/` и `django_extensions`.
- `media/` — фото тьюторов (`media/tutors_photos/...`) и Excel‑файлы занятий (`media/lessons/...`).

Технические заметки/особенности
- В `views.py` несколько функций `index` определены повторно — конечной будет последняя (без @login_required).
- Есть две логики логина: `/sign_in/` (AJAX) и `/login/` (просто страница). `login.js` POST’ит в `/login/`, что может не совпадать с backend‑логикой.
- `user_register` в views использует `username`, но в CustomUser `username` отключён — выглядит как legacy.
- `validate_token` обращается к `tutor_app_tutorinvitetoken.status`, хотя в модели нет поля `status`.
- Бот и views используют SQL‑таблицу `tutor_app_tokens`, которой нет в миграциях (вероятно, создана вручную).
- В templates/JS встречается смешанная кодировка (часть строк отображается как “кракозябры”).

План переноса (FastAPI + PostgreSQL + React/Vite)
1) Инвентаризация фич: список сценариев, ролей и экранов; фиксируем 1:1 поведение.
2) Проектирование: ER‑модель Postgres, Pydantic‑схемы, API‑контракты, стратегия auth.
3) Бекенд: FastAPI, Alembic миграции, модели, сервисный слой, email‑верификация,
   уведомления, Excel‑генерация, интеграция Telegram‑бота.
4) Фронтенд: React/Vite, маршрутизация, формы, состояние, интеграция с API,
   перенос базового дизайна и доработки по необходимости.
5) Тестирование и стабилизация: регресс 1:1, ручные сценарии, подготовка к деплою.

Принятые решения для нового стека
- Auth: JWT (access/refresh), refresh в httpOnly cookies, access в памяти.
- Данные: начинаем с нуля, без миграции из MySQL.
- Админ‑роль: добавить после основного переноса (CRUD анкет/профилей и модерация).
