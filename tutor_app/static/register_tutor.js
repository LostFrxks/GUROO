document.getElementById("register-tutor-form").addEventListener("submit", async function(event) {
    event.preventDefault(); // Останавливаем стандартное поведение формы

    // ✅ Собираем данные из формы
    const data = {
        token: document.querySelector("[name='token']").value,
        first_name: document.querySelector("[name='first_name']").value,
        last_name: document.querySelector("[name='last_name']").value,
        email: document.querySelector("[name='email']").value,
        password: document.querySelector("[name='password']").value,
        confirm_password: document.querySelector("[name='confirm_password']").value,
    };

    console.log("Отправляем данные:", data);  // ✅ Лог в консоль

    try {
        const response = await fetch("/complete_tutor_registration/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log("Ответ от сервера:", result);  // ✅ Лог в консоль

        if (result.success) {
            alert("🎉 Регистрация завершена! Переход на страницу входа...");
            window.location.href = "/login/";  // ✅ Перенаправляем на страницу логина
        } else {
            alert("❌ Ошибка: " + result.message);
        }
    } catch (error) {
        console.error("Ошибка при отправке запроса:", error);
        alert("⚠ Произошла ошибка! Попробуйте снова.");
    }
});
