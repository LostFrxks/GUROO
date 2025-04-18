document.addEventListener("DOMContentLoaded", function () {
    const daysContainer = document.getElementById("days-container");
    const addDayBtn = document.getElementById("add-day-btn");
    const scheduleInput = document.getElementById("schedule-input");

    const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    let selectedDays = new Set();

    // ✅ Загружаем сохраненное расписание
    let existingSchedule = JSON.parse(scheduleInput.value || "{}");
    Object.entries(existingSchedule).forEach(([day, time]) => {
        addDaySlot(day, time);
    });

    function addDaySlot(selectedDay = "", selectedTime = "") {
        if (selectedDays.size >= 2) {
            addDayBtn.style.display = "none";
            return;
        }

        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day-entry");

        const daySelect = document.createElement("select");
        daySelect.name = "days[]";

        daysOfWeek.forEach(day => {
            const option = document.createElement("option");
            option.value = day;
            option.textContent = day;
            if (day === selectedDay) option.selected = true;
            if (!selectedDays.has(day) || day === selectedDay) {
                daySelect.appendChild(option);
            }
        });

        const timeSelect = document.createElement("input");
        timeSelect.type = "time";
        timeSelect.name = "times[]";
        timeSelect.required = true;
        timeSelect.value = selectedTime;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.classList.add("delete-day");
        deleteBtn.addEventListener("click", () => {
            selectedDays.delete(daySelect.value);
            dayDiv.remove();
            updateScheduleInput();
            addDayBtn.style.display = "inline-block";
        });

        daySelect.addEventListener("change", () => {
            selectedDays.delete(selectedDay);
            selectedDays.add(daySelect.value);
            updateScheduleInput();
        });

        timeSelect.addEventListener("change", updateScheduleInput);

        dayDiv.appendChild(daySelect);
        dayDiv.appendChild(timeSelect);
        dayDiv.appendChild(deleteBtn);
        daysContainer.appendChild(dayDiv);

        selectedDays.add(selectedDay || daySelect.value);
        updateScheduleInput();

        if (selectedDays.size >= 2) {
            addDayBtn.style.display = "none";
        }
    }

    function updateScheduleInput() {
        let schedule = {};
        document.querySelectorAll(".day-entry").forEach(entry => {
            const day = entry.querySelector("select").value;
            const time = entry.querySelector("input").value;
            schedule[day] = time;
        });
        scheduleInput.value = JSON.stringify(schedule);
    }

    addDayBtn.addEventListener("click", () => addDaySlot());
});
