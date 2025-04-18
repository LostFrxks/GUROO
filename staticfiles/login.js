function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

document.addEventListener("DOMContentLoaded", function () {
    
    console.log("JS для входа загружен!");

    const loginForm = document.querySelector("#login-form");

    const errorMessage = document.createElement("p");
    errorMessage.style.color = "red";
    errorMessage.style.marginTop = "10px";
    loginForm.appendChild(errorMessage); // Добавляем ошибку под форму

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let email = document.querySelector("#email").value;
        let password = document.querySelector("#password").value;

        console.log("📩 Отправляем запрос на API...");

        fetch("/api/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()  // ✅ Передаем CSRF-токен
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("✅ Успешный вход! Перенаправляем на /tutors/");
                window.location.href = "/tutors/"; // 🔥 ✅ Теперь редиректит на страницу тьюторов
            } else {
                errorMessage.textContent = data.error || "Ошибка входа!"; // ✅ Показываем текст ошибки в форме
            }
        })
        .catch(error => {
            console.error("Ошибка при логине:", error);
            errorMessage.textContent = "Ошибка сети! Попробуйте еще раз."; // ✅ Выводим ошибку сети
        });
    });

    const logoutButton = document.querySelector("#logout-button");

    if (!logoutButton) {
        console.warn("⚠️ Кнопка выхода не найдена, пропускаем обработчик logout.");
        return;
    }

    logoutButton.addEventListener("click", function () {
        fetch("/api/logout/", { 
            method: "POST",
            headers: { "X-CSRFToken": getCSRFToken() }  // ✅ CSRF-токен для логаута
        })
        .then(response => response.json())
        .then(data => {
            console.log("Ответ сервера:", data);
            if (data.success) {
                alert("🚪 Вы вышли из аккаунта!");
                window.location.href = "/login/";
            } else {
                alert("❌ Ошибка при выходе: " + data.message);
            }
        })
        .catch(error => console.error("Ошибка выхода:", error));
    });
});
