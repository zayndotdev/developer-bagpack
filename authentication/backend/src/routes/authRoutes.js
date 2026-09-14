/**
 * ==============================================================================
 * 📍 FILE: src/routes/authRoutes.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Routing Layer -> Primary Authentication Endpoints
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `server.js` (under prefix `/api/v1/auth`)
 * - Delegates to:
 *   - `src/controllers/authController.js`
 *   - `src/controllers/passwordController.js`
 *   - `src/middleware/authMiddleware.js`
 *   - `src/middleware/validateMiddleware.js`
 *   - `src/middleware/rateLimiters.js`
 *
 * 💡 WHY THIS EXISTS:
 * Defines and binds HTTP verbs and URI paths to their respective security
 * middlewares, rate limiters, input validators, and business controllers.
 * ==============================================================================
 */

import { Router } from 'express';
import {
  signup,
  verifyEmail,
  resendVerification,
  login,
  refreshSession,
  logout,
  getMe,
} from '../controllers/authController.js';
import {
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/passwordController.js';
import { verifyAuth } from '../middleware/authMiddleware.js';
import {
  validateSignup,
  validateLogin,
  validateEmailOnly,
  validateResetPassword,
  validateChangePassword,
} from '../middleware/validateMiddleware.js';
import {
  loginLimiter,
  emailActionLimiter,
  registerLimiter,
} from '../middleware/rateLimiters.js';

const router = Router();

// ------------------------------------------------------------------------------
// PUBLIC AUTHENTICATION ROUTES
// ------------------------------------------------------------------------------

// User registration
router.post('/signup', registerLimiter, validateSignup, signup);

// Email verification
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', emailActionLimiter, validateEmailOnly, resendVerification);

// User login
router.post('/login', loginLimiter, validateLogin, login);

// Session refresh (Rotates Refresh Token from HTTP-only cookie)
router.post('/refresh', refreshSession);

// Logout (Revokes Refresh Token)
router.post('/logout', logout);

// Password recovery
router.post('/forgot-password', emailActionLimiter, validateEmailOnly, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);

// ------------------------------------------------------------------------------
// PROTECTED AUTHENTICATION ROUTES (Requires Active Access Token)
// ------------------------------------------------------------------------------

// Change password
router.post('/change-password', verifyAuth, validateChangePassword, changePassword);

// Current user identity check
router.get('/me', verifyAuth, getMe);

export default router;
