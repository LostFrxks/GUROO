document.addEventListener("DOMContentLoaded", function () {
    const emailField = document.querySelector("#email");
    // if (!emailField) {
    //     console.error("❌ Поле email не найдено в DOM!");
    //     alert("Ошибка! Вернитесь к верификации.");
    //     window.location.href = "/register/";
    //     return;
    // }

    const email = emailField.value.trim(); // Берем email из input
    console.log("📩 Email из Django:", email); // Логируем email в консоль

    // if (!email) {
    //     alert("Ошибка! Вернитесь к верификации.");
    //     window.location.href = "/register/";
    //     return;
    // }

    document.querySelector("#register-form").addEventListener("submit", function (e) {
        e.preventDefault();

        let data = {
            email: email,
            first_name: document.querySelector("#first_name").value,
            last_name: document.querySelector("#last_name").value,
            group: document.querySelector("#group").value,
            course: document.querySelector("#course").value,
            password: document.querySelector("#password").value
        };

        fetch("/api/complete_registration/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("✅ Регистрация завершена!");
                window.location.href = "/";
            } else {
                alert("Ошибка: " + data.error);
            }
        })
        .catch(error => console.error("Ошибка регистрации:", error));
    });
});
