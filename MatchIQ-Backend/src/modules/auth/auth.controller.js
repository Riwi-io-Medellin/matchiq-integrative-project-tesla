import { validateRegister, validateVerifyEmail, validateResendCode } from './auth.validation.js';
import { authService } from './auth.service.js';
import { generateAccessToken } from '../../utils/jwt.js';

async function registerCandidate(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;
    validateRegister({ email, password, confirmPassword });
    const result = await authService.register({ email, password, role: 'candidate' });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function registerCompany(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;
    validateRegister({ email, password, confirmPassword });
    const result = await authService.register({ email, password, role: 'company' });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      throw new Error('Email y password son obligatorios');
    }

    const { token, user } = await authService.login({ email, password });

    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge,
    });

    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (error) {
    if (error.message === 'UNVERIFIED_EMAIL') {
      return res.status(403).json({
        code: 'UNVERIFIED_EMAIL',
        message: 'Debes verificar tu email antes de ingresar. Te enviamos un nuevo código.',
      });
    }
    return res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: error.message,
    });
  }
}

// async function logout(req, res) {
//   try {
//     res.clearCookie('token', {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//     });
//     return res.status(200).json({ ok: true, message: 'Sesión cerrada exitosamente' });
//   } catch (error) {
//     return res.status(400).json({ code: 'LOGOUT_FAILED', message: error.message });
//   }
// }

async function logout(req, res) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    return res.status(200).json({ ok: true, message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    return res.status(400).json({ code: 'LOGOUT_FAILED', message: error.message });
  }
}

async function me(req, res) {
  try {
    if (!req.user) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    if (req.user.role === 'admin') {
      return res.status(200).json({
        authenticated: true,
        user: { id: req.user.id, email: req.user.email, role: 'admin' }
      });
    }

    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    return res.status(200).json({
      authenticated: true,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (error) {
    return res.status(200).json({ authenticated: false, user: null });
  }
}

async function checkMe(req, res) {
  try {
    const { verifyAccessToken } = await import('../../utils/jwt.js');
    const tokenFromCookie = req.cookies?.token;

    if (!tokenFromCookie) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    const payload = verifyAccessToken(tokenFromCookie);

    if (payload.role === 'admin') {
      return res.status(200).json({
        authenticated: true,
        user: { id: payload.id || null, email: payload.email, role: 'admin' }
      });
    }

    const user = await authService.getUserById(payload.id);

    if (!user) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    return res.status(200).json({
      authenticated: true,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (error) {
    return res.status(200).json({ authenticated: false, user: null });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'El email es obligatorio.' });
    }
    await authService.forgotPassword({ email });
    return res.status(200).json({ ok: true, message: 'Si el email está registrado, recibirás un enlace en breve.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener mínimo 6 caracteres.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    await authService.resetPassword({ token, newPassword });
    return res.status(200).json({ ok: true, message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function googleCallback(req, res) {
  try {
    const user = req.user;

    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 2 * 60 * 60 * 1000,
    });

    if (user.role === 'candidate') {
      return res.redirect(`${process.env.FRONTEND_URL}/public/candidate/index.html`);
    } else if (user.role === 'company') {
      return res.redirect(`${process.env.FRONTEND_URL}/public/company/index.html`);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/public/login.html`);
    }
  } catch (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/public/login.html?error=google_failed`);
  }
}

async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;
    validateVerifyEmail({ email, code });

    const { token, user } = await authService.verifyCode({ email, code });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
    });

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function resendVerificationCode(req, res) {
  try {
    const { email } = req.body;
    validateResendCode({ email });

    await authService.resendVerificationCode({ email });

    return res.status(200).json({ ok: true, message: 'Código reenviado.' });

  } catch (error) {
    if (error.message === 'ALREADY_VERIFIED') {
      return res.status(400).json({ message: 'Este email ya está verificado.' });
    }
    return res.status(500).json({ message: error.message });
  }
}

export const authController = {
  registerCandidate,
  registerCompany,
  login,
  logout,
  me,
  checkMe,
  forgotPassword,
  resetPassword,
  googleCallback,
  verifyEmail,
  resendVerificationCode,
};