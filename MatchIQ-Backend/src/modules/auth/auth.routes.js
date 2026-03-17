import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import passport from '../../config/passport.js';

const router = Router();

// Rutas públicas
router.post('/register/candidate', authController.registerCandidate);
router.post('/register/company', authController.registerCompany);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);
router.post('/verifyEmail', authController.verifyEmail);
router.post('/resendVerificationCode', authController.resendVerificationCode);

// Verificar sesión
router.get('/me', authController.checkMe);

// Rutas protegidas
router.post('/logout', authenticate, authController.logout);
router.get('/me-protected', authenticate, authController.me);

// Google OAuth
router.get('/google', (req, res, next) => {
  const role = req.query.role || 'candidate';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: role,
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/public/login.html?error=google_failed`,
  }),
  authController.googleCallback
);

export default router;