import { apiResetPassword } from "../api/authApi.js";

const $ = (sel) => document.querySelector(sel);

document.addEventListener("DOMContentLoaded", () => {
    const form = $("#resetForm");
    const newPasswordInput = $("#newPassword");
    const confirmPasswordInput = $("#confirmPassword");
    const newPasswordError = $("#newPasswordError");
    const confirmPasswordError = $("#confirmPasswordError");
    const formAlert = $("#formAlert");
    const submitBtn = $("#submitBtn");
    const invalidToken = $("#invalidToken");

    // Leer token de la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        form.hidden = true;
        invalidToken.hidden = false;
        return;
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.textContent = loading ? "Saving..." : "Save password";
    }

    function showAlert(message, isError = true) {
        formAlert.textContent = message;
        formAlert.className = `alert${isError ? " is-error" : ""}`;
        formAlert.hidden = false;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        newPasswordError.textContent = "";
        confirmPasswordError.textContent = "";
        formAlert.hidden = true;

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        let valid = true;

        if (!newPassword || newPassword.length < 6) {
            newPasswordError.textContent = "Mínimo 6 caracteres.";
            valid = false;
        }

        if (!confirmPassword) {
            confirmPasswordError.textContent = "Please confirm your password.";
            valid = false;
        }

        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            confirmPasswordError.textContent = "Passwords do not match.";
            valid = false;
        }

        if (!valid) return;

        setLoading(true);

        try {
            await apiResetPassword({ token, newPassword, confirmPassword });
            showAlert("✅ Password updated. Redirecting to login...", false);
            setTimeout(() => {
                window.location.href = "./login.html";
            }, 2000);
        } catch (err) {
            if (err.message?.includes("invalid") || err.message?.includes("expired")) {
                form.hidden = true;
                invalidToken.hidden = false;
            } else {
                showAlert(err.message || "Error updating password.");
            }
        } finally {
            setLoading(false);
        }
    });
});