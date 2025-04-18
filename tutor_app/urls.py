from django.urls import path
from . import views
from .views import (
    get_tutors, register_tutor, confirm_registration, 
    user_login, user_register, mark_attendance,
    register_page, send_verification_code, verify_code,
    register_form, complete_registration, user_logout, get_csrf_token,
    edit_tutor_profile, get_tutor_schedule, save_lesson_details
)

print("📌 [DEBUG] Файл tutor_app/urls.py загружен!")

urlpatterns = [
    path('', views.main_page, name='main_page'),  # Главная страница
    path('about/', views.about_page, name='about_page'),  # О нас
    path('tutors/', views.index, name='tutors'),  # Страница тьюторов
    
    path('get_tutors/', get_tutors, name='get_tutors'),
    path('register_tutor/<int:tutor_id>/<int:student_id>/', register_tutor, name='register_tutor'),
    path('confirm_registration/<int:record_id>/', confirm_registration, name='confirm_registration'),
    path('sign_in/', user_login, name="sign_in"),
    path('logout/', user_logout, name="logout"),
    path('mark_attendance/<int:tutor_id>/', mark_attendance, name='mark_attendance'),
    path('send_verification_code/', send_verification_code, name="send_verification_code"),
    path('verify_code/', verify_code, name='verify_code'),
    path('complete_registration/', complete_registration, name='complete_registration'),
    path("get_csrf/", get_csrf_token, name="get_csrf"),
    path('edit_tutor_profile/', edit_tutor_profile, name='edit_tutor_profile'),
    path("get_registered_tutors/", views.get_registered_tutors, name="get_registered_tutors"),
    path("get_tutor_schedule/", get_tutor_schedule, name="get_tutor_schedule"),
    path("tutor_signup/<str:token>/", views.register_tutor_page, name="tutor_signup"),
    path('complete_tutor_registration/', views.complete_tutor_registration, name='complete_tutor_registration'),
    path("validate_token/", views.validate_token, name="validate_token"),
    path("check_user_registration/", views.check_user_registration, name="check_user_registration"),  # ✅ Исправлено!

    path("send-tutor-request/", views.send_tutor_request, name="send_tutor_request"),
    path("confirm-tutor/<uuid:token>/", views.confirm_tutor_request, name="confirm_tutor_request"),

    path("get_my_lessons/", views.get_my_lessons, name="get_my_lessons"),

    path('get_notifications/', views.get_notifications, name='get_notifications'),
    path('send_acceptance_notification/', views.send_acceptance_notification, name='send_acceptance_notification'),
    path("confirm-via-notification/", views.confirm_via_notification, name="confirm_via_notification"),
    path("decline-tutor-request/", views.decline_tutor_request, name="decline_tutor_request"),

    path("get_schedule_with_attendance/", views.get_tutor_schedule_with_attendance, name="get_schedule_with_attendance"),
    path("submit_attendance/", views.submit_attendance, name="submit_attendance"),
    path("save_lesson_details/", save_lesson_details, name="save_lesson_details"),
]