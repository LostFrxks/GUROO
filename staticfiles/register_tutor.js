document.getElementById("tutor-register-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const data = {
        token: document.getElementById("token").value,
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        group: document.getElementById("group").value,
        subject: document.getElementById("subject").value,
        course: document.getElementById("course").value,  // ✅ Добавлено
        password: document.getElementById("password").value,
    };

    const response = await fetch("/api/complete_tutor_registration/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
        alert("Регистрация завершена!");
        window.location.href = "/login/";  // ✅ Перенаправление после регистрации
    } else {
        alert("Ошибка: " + result.error);
    }
});
