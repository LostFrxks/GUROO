from django.contrib import admin
from django.urls import path, include
from tutor_app.views import index, register_page, register_form, login_page  # Подключаем нужные страницы
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
import pprint
from django.urls import get_resolver
from tutor_app import views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('tutor_app.urls')),  # ✅ Теперь все страницы в одном месте
    path('register/', register_page, name='register'),
    path('register_form/', register_form, name='register_form'),  # 📌 Форма регистрации
    path('login/', login_page, name='login'),  # 📌 Страница логина
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

pp = pprint.PrettyPrinter(indent=4)
pp.pprint(get_resolver().reverse_dict.keys())
