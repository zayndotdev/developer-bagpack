/**
 * ==============================================================================
 * 📍 FILE: src/routes/twoFactorRoutes.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Routing Layer -> Two-Factor Authentication Endpoints (TOTP & Email OTP)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `server.js` (under prefix `/api/v1/auth/2fa`)
 * - Delegates to:
 *   - `src/controllers/twoFactorController.js`
 *   - `src/middleware/authMiddleware.js`
 *   - `src/middleware/rateLimiters.js`
 *
 * 💡 WHY THIS EXISTS:
 * Separates 2FA enrollment, challenges, and recovery routing into a clean, dedicated
 * module, supporting both Google Authenticator and Email OTP flows.
 * ==============================================================================
 */

import { Router } from 'express';
import {
  setupTotp,
  enableTotp,
  requestEmailOtp,
  enableEmail2fa,
  disable2fa,
  verifyLoginChallenge,
  regenerateBackupCodes,
} from '../controllers/twoFactorController.js';
import { verifyAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { twoFactorLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// ------------------------------------------------------------------------------
// PUBLIC 2FA CHALLENGE VERIFICATION (Called during multi-step login or settings enrollment)
// ------------------------------------------------------------------------------

// Verify 2FA challenge code using temporary mfaTicket
router.post('/verify-challenge', twoFactorLimiter, verifyLoginChallenge);

// Dispatch an Email OTP during login challenge (with mfaTicket) or settings enrollment (with optionalAuth)
router.post('/send-email-otp', twoFactorLimiter, optionalAuth, requestEmailOtp);

// ------------------------------------------------------------------------------
// PROTECTED 2FA MANAGEMENT (Settings & Enrollment)
// ------------------------------------------------------------------------------

// Step 1: Generate QR code and TOTP secret
router.post('/setup-totp', verifyAuth, setupTotp);

// Step 2: Confirm code and activate Google Authenticator
router.post('/enable-totp', verifyAuth, twoFactorLimiter, enableTotp);

// Activate Email OTP as 2FA method
router.post('/enable-email', verifyAuth, twoFactorLimiter, enableEmail2fa);

// Disable Two-Factor Authentication (requires password verification)
router.post('/disable', verifyAuth, disable2fa);

// Generate/Regenerate emergency backup recovery codes
router.post('/backup-codes', verifyAuth, regenerateBackupCodes);

export default router;
