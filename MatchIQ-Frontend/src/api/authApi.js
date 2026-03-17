import { apiFetch } from "./apiClient.js";

const SESSION_KEY = "matchiq_session";

function saveSession(user, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(user));
  (remember ? sessionStorage : localStorage).removeItem(SESSION_KEY);
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  return loadSession();
}

export async function registerCandidate({ email, password, confirmPassword }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();
  const normalizedConfirm = String(confirmPassword ?? "").trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedConfirm) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (normalizedPassword.length < 6) {
    throw new Error("La contraseña debe tener mínimo 6 caracteres.");
  }
  if (normalizedPassword !== normalizedConfirm) {
    throw new Error("Las contraseñas no coinciden.");
  }

  const result = await apiFetch("/auth/register/candidate", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      confirmPassword: normalizedConfirm,
    }),
  });

  return { email: normalizedEmail, requiresVerification: result.requiresVerification };
}

export async function registerCompany({ email, password, confirmPassword }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();
  const normalizedConfirm = String(confirmPassword ?? "").trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedConfirm) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (normalizedPassword.length < 6) {
    throw new Error("La contraseña debe tener mínimo 6 caracteres.");
  }
  if (normalizedPassword !== normalizedConfirm) {
    throw new Error("Las contraseñas no coinciden.");
  }

  const result = await apiFetch("/auth/register/company", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      confirmPassword: normalizedConfirm,
    }),
  });

  return { email: normalizedEmail, requiresVerification: result.requiresVerification };
}

export async function authLogin({ email, password, remember }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();

  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      rememberMe: !!remember,
    }),
  });

  saveSession(response.user, !!remember);
  return { user: response.user };
}

export async function authMe() {
  try {
    const response = await apiFetch("/auth/me", { method: "GET" });
    if (response?.authenticated && response.user) {
      saveSession(response.user, true);
      return { authenticated: true, user: response.user };
    }
    clearSession();
    return { authenticated: false, user: null };
  } catch {
    clearSession();
    return { authenticated: false, user: null };
  }
}

export async function authLogout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {}
  clearSession();
  return { ok: true };
}

export async function apiForgotPassword({ email }) {
  return apiFetch("/auth/forgotPassword", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword({ token, newPassword, confirmPassword }) {
  return apiFetch("/auth/resetPassword", {
    method: "POST",
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}

export async function apiVerifyEmail({ email, code }) {
  return apiFetch("/auth/verifyEmail", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function apiResendCode({ email }) {
  return apiFetch("/auth/resendVerificationCode", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}