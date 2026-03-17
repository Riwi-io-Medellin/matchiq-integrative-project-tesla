import { apiVerifyEmail, apiResendCode } from "../api/authApi.js";

const $ = (sel) => document.querySelector(sel);

const emailDisplay  = $("#emailDisplay");
const codeInput     = $("#code");
const verifyBtn     = $("#verifyBtn");
const resendBtn     = $("#resendBtn");
const errorBanner   = $("#error-banner");
const successBanner = $("#success-banner");

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

function setLoading(btn, isLoading) {
  btn.disabled = isLoading;
  btn.classList.toggle("is-loading", isLoading);
}

function redirectAfterVerify(user) {
  if (user.role === "candidate") {
    window.location.href = "./candidate/index.html";
  } else if (user.role === "company") {
    window.location.href = "./company/index.html";
  } else {
    window.location.href = "./login.html";
  }
}

// Leer email de la URL
const params = new URLSearchParams(window.location.search);
const email  = params.get("email") || "";

if (!email) {
  window.location.href = "./login.html";
}

if (emailDisplay) {
  emailDisplay.textContent = email;
}

// Solo permitir números en el input
codeInput?.addEventListener("input", () => {
  codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
});

// Verificar código
verifyBtn?.addEventListener("click", async () => {
  clearBanners();
  const code = codeInput.value.trim();

  if (code.length !== 6) {
    showError("El código debe tener 6 dígitos.");
    return;
  }

  setLoading(verifyBtn, true);

  try {
    const result = await apiVerifyEmail({ email, code });
    showSuccess("¡Email verificado! Redirigiendo...");
    setTimeout(() => redirectAfterVerify(result.user), 1500);
  } catch (err) {
    showError(err.message || "Código inválido o expirado.");
  } finally {
    setLoading(verifyBtn, false);
  }
});

// Reenviar código
resendBtn?.addEventListener("click", async () => {
  clearBanners();
  setLoading(resendBtn, true);

  try {
    await apiResendCode({ email });
    showSuccess("Código reenviado. Revisa tu correo.");
  } catch (err) {
    showError(err.message || "Error al reenviar el código.");
  } finally {
    setLoading(resendBtn, false);
  }
});