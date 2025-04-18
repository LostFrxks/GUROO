from datetime import time

def generate_schedule_slots():
    slots = []
    hour, minute = 8, 0  # Начинаем с 8:00

    while hour < 19:
        start_time = time(hour, minute).strftime("%H:%M")  # Формат "08:00"
        slots.append(start_time)

        # Добавляем 1 час 20 минут, учитывая возможный выход за 59 минут
        minute += 20
        if minute >= 60:
            hour += 1
            minute -= 60

        hour += 1  # Переключаем на следующий час

        # Исключаем большую перемену (10:50 - 11:40)
        if (hour == 10 and minute == 50) or (hour == 11 and minute < 40):
            hour, minute = 11, 40

    return slots
