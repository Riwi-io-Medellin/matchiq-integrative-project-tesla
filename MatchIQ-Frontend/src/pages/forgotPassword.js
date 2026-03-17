import { apiForgotPassword } from "../api/authApi.js";

const $ = (sel) => document.querySelector(sel);

document.addEventListener("DOMContentLoaded", () => {
    const form = $("#forgotForm");
    const emailInput = $("#email");
    const emailError = $("#emailError");
    const formAlert = $("#formAlert");
    const successHint = $("#successHint");
    const submitBtn = $("#submitBtn");

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.textContent = loading ? "Enviando..." : "Enviar enlace";
    }

    function showAlert(message, isError = true) {
        formAlert.textContent = message;
        formAlert.className = `alert${isError ? " is-error" : ""}`;
        formAlert.hidden = false;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        emailError.textContent = "";
        formAlert.hidden = true;
        successHint.hidden = true;

        const email = emailInput.value.trim();

        if (!email) {
            emailError.textContent = "Email is required.";
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            emailError.textContent = "Ingresa un email válido.";
            return;
        }

        setLoading(true);

        try {
            await apiForgotPassword({ email });
            form.hidden = true;
            successHint.hidden = false;
        } catch (err) {
            showAlert(err.message || "Error al enviar el enlace. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    });
});