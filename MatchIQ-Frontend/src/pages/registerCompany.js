import { registerCompany } from "../api/authApi.js";
import { DEFAULT_BASE_URL } from "../api/apiClient.js";

const form          = document.querySelector("form.card");
const emailInput    = document.getElementById("email");
const passInput     = document.getElementById("password");
const confirmInput  = document.getElementById("confirmPassword");
const submitBtn     = document.getElementById("submitBtn");
const errorBanner   = document.getElementById("error-banner");
const successBanner = document.getElementById("success-banner");

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
  successBanner.hidden = true;
}

function showSuccess(message) {
  successBanner.textContent = message;
  successBanner.hidden = false;
  errorBanner.hidden = true;
}

function clearBanners() {
  errorBanner.hidden = true;
  successBanner.hidden = true;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanners();

  const email           = emailInput.value.trim();
  const password        = passInput.value.trim();
  const confirmPassword = confirmInput.value.trim();

  setLoading(true);

  try {
    const result = await registerCompany({ email, password, confirmPassword });

    showSuccess("¡Cuenta creada! Revisa tu correo para verificar tu cuenta.");

    setTimeout(() => {
      window.location.href = `./verifyEmail.html?email=${encodeURIComponent(result.email)}`;
    }, 1500);

  } catch (error) {
    showError(error.message || "Algo salió mal. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
});

document.getElementById("googleBtn").href = `${DEFAULT_BASE_URL}/auth/google?role=company`;
