function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JS загружен!");

    const form = document.querySelector("#email-form");
    const verifySection = document.querySelector("#verify-section");
    const verificationInput = document.querySelector("#verification-code");
    let verifyButton = document.querySelector("#verify-form button");

    // ✅ КНОПКА ВОЗВРАТА НА АВТОРИЗАЦИЮ
    // const backToLogin = document.createElement("p");
    // backToLogin.innerHTML = 'Уже есть аккаунт? <a href="/login/" id="back-to-login">Войти</a>';
    // backToLogin.style.marginTop = "10px";
    // form.appendChild(backToLogin);

    // ✅ Создаем элемент для вывода ошибки
    const errorMessage = document.createElement("p");
    errorMessage.style.color = "red";
    errorMessage.style.marginTop = "10px";
    form.appendChild(errorMessage);

    if (form) {
        console.log("✅ Форма регистрации найдена!");

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            let emailInput = document.querySelector("#email").value.trim();
            console.log("📩 Введенный email:", emailInput);

            if (!emailInput.endsWith("@auca.kg")) {
                errorMessage.textContent = "❌ Вы должны использовать корпоративную почту @auca.kg!";
                return;
            }

            console.log("⏳ Отправляем запрос на API...");
            fetch("/api/send_verification_code/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput })
            })
            .then(response => response.json())
            .then(data => {
                console.log("📨 Ответ сервера:", data);
                if (data.success) {
                    errorMessage.textContent = ""; // Очищаем ошибку
                    alert("✅ Код отправлен! Проверьте почту.");
                    verifySection.style.display = "block";
                    verifyButton.setAttribute("data-email", emailInput);
                } else {
                    errorMessage.textContent = "❌ " + data.error; // Показываем ошибку
                }
            })
            .catch(error => {
                console.error("❌ Ошибка отправки кода:", error);
                errorMessage.textContent = "❌ Ошибка сети! Попробуйте еще раз.";
            });
        });
    } else {
        console.warn("⚠️ Форма регистрации не найдена.");
    }

    if (verifyButton) {
        verifyButton.type = "button";
        verifyButton.addEventListener("click", function (e) {
            e.preventDefault();

            let email = verifyButton.getAttribute("data-email");
            let codeInput = verificationInput.value.trim();

            if (!codeInput) {
                alert("⚠️ Введите код подтверждения!");
                return;
            }

            console.log("🔄 Отправляем код верификации...");

            fetch("/api/verify_code/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, code: codeInput })
            })
            .then(response => response.json())
            .then(data => {
                console.log("📨 Ответ сервера на верификацию:", data);
                if (data.success) {
                    window.location.href = "/register_form/";
                } else {
                    alert("❌ Ошибка верификации: " + data.error);
                }
            })
            .catch(error => console.error("❌ Ошибка при верификации кода:", error));
        });
    } else {
        console.warn("⚠️ Кнопка подтверждения не найдена.");
    }
});
