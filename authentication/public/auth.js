document.addEventListener("DOMContentLoaded", function() {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    if (registerForm) {
        registerForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            fetch("/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("message").textContent = data.message;
            })
            .catch(error => {
                console.error("Error:", error);
            });
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            fetch("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("message").textContent = data.message;
            })
            .catch(error => {
                console.error("Error:", error);
            });
        });
    }
});
