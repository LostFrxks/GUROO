from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, CustomUserManager, TutorProfile, TutorStudent

# ✅ Добавляем кастомное управление пользователями
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_active', 'is_tutor')
    search_fields = ('email', 'role')

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Персональная информация", {"fields": ("first_name", "last_name", "role")}),
        ("Разрешения", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Даты", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "role", "is_staff", "is_active"),
        }),
    )

# ✅ Регистрируем TutorProfile и TutorStudent
# admin.site.register(TutorProfile)
# admin.site.register(TutorStudent)

@admin.register(TutorStudent)
class TutorStudentAdmin(admin.ModelAdmin):
    list_display = ('tutor', 'student', 'confirmed')  # Показывает тьютора, студента и статус подтверждения
    search_fields = ('tutor__user__email', 'student__email')  # ✅ Исправил 'username' → 'email', так как теперь email - основной ID
    list_filter = ('confirmed',)  # Фильтр по статусу

@admin.register(TutorProfile)
class TutorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject')  # ✅ Убрали rating
    search_fields = ('user__email', 'subject')
    list_filter = ('subject',)  # ✅ Можно фильтровать по предмету

admin.site.site_header = "Панель администратора"  # (Необязательно) Меняем заголовок