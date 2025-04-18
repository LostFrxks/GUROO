from django import forms
from .models import TutorProfile
from .utils import generate_schedule_slots

DAYS_OF_WEEK = [
    ('Monday', 'Понедельник'),
    ('Tuesday', 'Вторник'),
    ('Wednesday', 'Среда'),
    ('Thursday', 'Четверг'),
    ('Friday', 'Пятница'),
    ('Saturday', 'Суббота'),
]

COURSE_CHOICES = [
    ('1', '1 курс'),
    ('2', '2 курс'),
    ('3', '3 курс'),
]

class TutorProfileForm(forms.ModelForm):
    course = forms.ChoiceField(
        choices=COURSE_CHOICES,
        required=True,
        label="Курс"
    )

    available_days = forms.MultipleChoiceField(
        choices=DAYS_OF_WEEK,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Дни недели для занятий"
    )

    available_times = forms.MultipleChoiceField(
        choices=[(t, t) for t in generate_schedule_slots()],
        widget=forms.SelectMultiple(attrs={"size": 10}),
        required=False,
        label="Доступные временные слоты"
    )

    class Meta:
        model = TutorProfile
        fields = ["group", "subject", "course", "bio", "photo"]

