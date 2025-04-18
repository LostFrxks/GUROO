from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
import hashlib
import os
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver
print("📦 [DEBUG] models.py загружен!")


# ✅ Менеджер для кастомного пользователя (без username)
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("У пользователя должен быть email")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None  # ❌ Убираем username
    email = models.EmailField(unique=True)  # ✅ Email вместо username
    telegram_id = models.BigIntegerField(null=True, blank=True, unique=True)
    is_tutor = models.BooleanField(default=False)
    group = models.CharField(max_length=50, blank=True, null=True)
    first_name = models.CharField(max_length=30, blank=True, null=True)  # ✅ Добавляем обратно
    last_name = models.CharField(max_length=30, blank=True, null=True)  # ✅ Добавляем обратно

    ROLE_CHOICES = [
        ('student', 'Студент'),
        ('tutor', 'Тьютор'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    profile_picture = models.ImageField(upload_to='avatars/', blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def save(self, *args, **kwargs):
        if self.role == "tutor":
            self.is_tutor = True
        else:
            self.is_tutor = False
        super().save(*args, **kwargs)

    def get_initials(self):
        """Возвращает инициалы пользователя (если имя и фамилия указаны)."""
        return f"{self.first_name[0].upper()}{self.last_name[0].upper()}" if self.first_name and self.last_name else "UU"

    def __str__(self):
        return self.email



# ✅ Функция для проверки расширения фото
def validate_image_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png']
    if ext not in valid_extensions:
        raise ValidationError('❌ Разрешены только файлы .jpg, .jpeg и .png.')


# ✅ Функция для вычисления хеша файла (чтобы не загружать дубликаты фото)
def get_file_hash(file):
    hasher = hashlib.sha256()
    for chunk in file.chunks():
        hasher.update(chunk)
    return hasher.hexdigest()


# ✅ Модель анкеты тьютора
class TutorProfile(models.Model):
    DAYS_OF_WEEK = [
        ('Monday', 'Понедельник'),
        ('Tuesday', 'Вторник'),
        ('Wednesday', 'Среда'),
        ('Thursday', 'Четверг'),
        ('Friday', 'Пятница'),
        ('Saturday', 'Суббота'),
    ]

    COURSE_CHOICES = [
        (1, '1 курс'),
        (2, '2 курс'),
        (3, '3 курс'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tutor_profile")
    group = models.CharField(max_length=20, verbose_name="Группа", blank=True, null=True)
    telegram = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=255, blank=True, null=True)
    first_name = models.CharField(max_length=30, blank=True, null=True)  # ✅ Добавляем
    last_name = models.CharField(max_length=30, blank=True, null=True)   # ✅ Добавляем
    subject = models.CharField(max_length=255, verbose_name="Предмет")
    own_course = models.IntegerField(null=True, blank=True)  # 👈 Курс самого тьютора (указывается при регистрации)
    course = models.IntegerField(choices=COURSE_CHOICES, verbose_name="Курс", default=1)
    bio = models.TextField(verbose_name="О себе", null=True, blank=True)
    last_lesson_topic = models.CharField(max_length=255, blank=True, null=True)
    last_lesson_location = models.CharField(max_length=255, blank=True, null=True)
    excel_generated = models.BooleanField(default=False)

    photo = models.ImageField(
        upload_to="tutors_photos",
        null=True,
        blank=True,
        verbose_name="Фото",
        default="tutors_photos/def.png"
    )
    schedule = models.JSONField(default=dict, verbose_name="Расписание")

    def save(self, *args, **kwargs):
        """Автоматически добавляет имя и фамилию из `user`, если их нет"""
        if not self.user.first_name or not self.user.last_name:
            raise ValueError("❌ У пользователя должны быть имя и фамилия!")

        if self.photo and not self.photo.name.endswith("default.png"):
            file_hash = get_file_hash(self.photo)
            existing_files = default_storage.listdir("tutors_photos/")[1]

            for existing_file in existing_files:
                existing_path = os.path.join(settings.MEDIA_ROOT, "tutors_photos", existing_file)
                if os.path.exists(existing_path):
                    with open(existing_path, "rb") as existing_f:
                        existing_hash = hashlib.sha256(existing_f.read()).hexdigest()
                        if existing_hash == file_hash:
                            self.photo.name = f"tutors_photos/{existing_file}"
                            break

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Анкета тьютора: {self.user.email} (Курс {self.course})"


# ✅ Модель связи студентов и тьюторов
class TutorStudent(models.Model):
    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="students")  
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tutors")  
    confirmed = models.BooleanField(default=False)
    attended = models.BooleanField(default=False)  # ✅ Был ли студент на встрече

    attendance_time = models.DateTimeField(null=True, blank=True)  # Новое поле!
    topic = models.CharField(max_length=255, null=True, blank=True)  # Тема урока
    location = models.CharField(max_length=255, null=True, blank=True)  
    class Meta:
        unique_together = ('tutor', 'student')

    def __str__(self):
        return f"{self.student.email} записался к {self.tutor.user.first_name} {self.tutor.user.last_name}"


# ✅ Токены для инвайта тьюторов
class TutorInviteToken(models.Model):
    token = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)  
    is_used = models.BooleanField(default=False)  
    created_at = models.DateTimeField(auto_now_add=True)  
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"Токен для {self.email} (использован: {self.is_used})"


# ✅ Создавать `TutorProfile` автоматически при регистрации тьютора
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_tutor_profile(sender, instance, created, **kwargs):
    if created and instance.role == "tutor":
        TutorProfile.objects.create(user=instance)


# models.py
class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)  # Пользователь, которому пришло уведомление
    message = models.CharField(max_length=512)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)  # Статус прочтено/не прочитано

    def __str__(self):
        return f"Уведомление для {self.user.email}: {self.message[:50]}..."
