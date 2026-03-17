import { authLogin, authMe, apiForgotPassword } from "../api/authApi.js";
import { DEFAULT_BASE_URL } from "../api/apiClient.js";


const $ = (sel) => document.querySelector(sel);

function setText(el, txt) {
  if (!el) return;
  el.textContent = txt || "";
}

function setAlert(el, message, type = "info") {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
  el.classList.toggle("is-error", type === "error");
}

function setLoading(buttonEl, isLoading) {
  if (!buttonEl) return;
  buttonEl.classList.toggle("is-loading", isLoading);
  buttonEl.disabled = isLoading;
}

function redirectAfterLogin(user) {
  const role = user?.role;
  const pending = sessionStorage.getItem("redirectTo");
  if (pending) {
    sessionStorage.removeItem("redirectTo");
    window.location.href = pending;
    return;
  }
  if (role === "admin") window.location.href = "./admin/dashboard.html";
  else if (role === "company") window.location.href = "./company/index.html";
  else window.location.href = "./candidate/index.html";
}

async function redirectIfAuthenticated() {
  try {
    const me = await authMe();
    if (me?.authenticated && me.user) redirectAfterLogin(me.user);
  } catch {}
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm       = $("#loginForm");
  const emailInput      = $("#email");
  const passwordInput   = $("#password");
  const rememberMeInput = $("#rememberMe");
  const emailError      = $("#emailError");
  const passwordError   = $("#passwordError");
  const loginAlert      = $("#loginAlert");
  const loginSubmitBtn  = $("#loginSubmitBtn");
  const loginSuccessHint = $("#loginSuccessHint");
  const goRecoverBtn    = $("#goRecoverBtn");
  const recoverForm     = $("#recoverForm");
  const recoverEmailInput = $("#recoverEmail");
  const recoverEmailError = $("#recoverEmailError");
  const recoverAlert    = $("#recoverAlert");
  const recoverSubmitBtn = $("#recoverSubmitBtn");
  const recoverSuccessHint = $("#recoverSuccessHint");
  const backToLoginBtn  = $("#backToLoginBtn");

  if (!loginForm || !emailInput || !passwordInput) {
    console.warn("[login.js] Missing required login elements.");
    return;
  }

  await redirectIfAuthenticated();

  function clearErrors() {
    setText(emailError, "");
    setText(passwordError, "");
    setText(recoverEmailError, "");
  }

  function showRecover() {
    clearErrors();
    setAlert(loginAlert, "");
    if (loginSuccessHint) loginSuccessHint.hidden = true;
    if (loginForm) loginForm.hidden = true;
    if (recoverForm) recoverForm.hidden = false;
  }

  function showLogin() {
    clearErrors();
    setAlert(recoverAlert, "");
    if (recoverSuccessHint) recoverSuccessHint.hidden = true;
    if (recoverForm) recoverForm.hidden = true;
    if (loginForm) loginForm.hidden = false;
  }

  function validateLogin() {
    let ok = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      setText(emailError, "El email es obligatorio.");
      ok = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setText(emailError, "Ingresa un email válido.");
      ok = false;
    }

    if (!password) {
      setText(passwordError, "La contraseña es obligatoria.");
      ok = false;
    }

    return ok;
  }

  function validateRecover() {
    let ok = true;
    const email = recoverEmailInput?.value.trim() || "";
    if (!email) {
      setText(recoverEmailError, "El email es obligatorio.");
      ok = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setText(recoverEmailError, "Ingresa un email válido.");
      ok = false;
    }
    return ok;
  }

  goRecoverBtn?.addEventListener("click", showRecover);
  backToLoginBtn?.addEventListener("click", showLogin);

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    setAlert(loginAlert, "");
    if (loginSuccessHint) loginSuccessHint.hidden = true;

    if (!validateLogin()) {
      setAlert(loginAlert, "Corrige los campos marcados.", "error");
      return;
    }

    setLoading(loginSubmitBtn, true);

    try {
      const email    = emailInput.value.trim();
      const password = passwordInput.value;
      const remember = !!rememberMeInput?.checked;

      const result = await authLogin({ email, password, remember });

      if (loginSuccessHint) loginSuccessHint.hidden = false;
      redirectAfterLogin(result.user);

    } catch (err) {
      // Email no verificado → redirigir a verificación
      if (err.status === 403 && err.data?.code === "UNVERIFIED_EMAIL") {
        const email = emailInput.value.trim();
        window.location.href = `./verifyEmail.html?email=${encodeURIComponent(email)}`;
        return;
      }
      setAlert(loginAlert, err?.message || "Error al iniciar sesión.", "error");
    } finally {
      setLoading(loginSubmitBtn, false);
    }
  });

  recoverForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    setAlert(recoverAlert, "");
    if (recoverSuccessHint) recoverSuccessHint.hidden = true;

    if (!validateRecover()) {
      setAlert(recoverAlert, "Corrige los campos marcados.", "error");
      return;
    }

    setLoading(recoverSubmitBtn, true);

    try {
      const email = recoverEmailInput.value.trim();
      await apiForgotPassword({ email });
      if (recoverSuccessHint) recoverSuccessHint.hidden = false;
      setAlert(recoverAlert, "Si el email está registrado, recibirás instrucciones en breve.", "info");
    } catch (err) {
      setAlert(recoverAlert, err?.message || "Error. Intenta de nuevo.", "error");
    } finally {
      setLoading(recoverSubmitBtn, false);
    }
  });
});

document.getElementById("googleBtn").href = `${DEFAULT_BASE_URL}/auth/google`;