# Generated by Django 5.1.7 on 2025-03-23 14:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tutor_app', '0002_tutorinvitetoken_student'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='group',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
