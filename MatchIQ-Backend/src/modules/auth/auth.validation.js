export function validateRegister({ email, password, confirmPassword }) {
  if (!email || !password || !confirmPassword) {
    throw new Error('Todos los campos son obligatorios');
  }

  if (password.length < 6) {
    throw new Error('La contraseña debe tener mínimo 6 caracteres');
  }

  if (password !== confirmPassword) {
    throw new Error('Las contraseñas no coinciden');
  }
}

export function validateVerifyEmail({ email, code }) {
  if (!email || !code) {
    throw new Error('Email y código son obligatorios.');
  }

  if (code.length !== 6 || isNaN(code)) {
    throw new Error('El código debe ser de 6 dígitos.');
  }
}

export function validateResendCode({ email }) {
  if (!email) {
    throw new Error('El email es obligatorio.');
  }
}