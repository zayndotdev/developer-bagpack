/**
 * ==============================================================================
 * 📍 FILE: src/controllers/twoFactorController.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Controller Layer -> Two-Factor Authentication (TOTP, Email OTP, Backup Codes)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `src/routes/twoFactorRoutes.js`
 * - Delegates to:
 *   - `src/services/twoFactorService.js` (TOTP generation, OTP validation, backup codes)
 *   - `src/services/tokenService.js` (Validates MFA ticket & issues final JWT tokens)
 *   - `src/middleware/rbacMiddleware.js` (Resolves user permissions for final token)
 * - Interacts with:
 *   - `src/models/User.js`
 *   - `src/utils/apiResponse.js`
 *
 * ==============================================================================
 * 🔄 END-TO-END FLOW: TWO-FACTOR AUTHENTICATION
 * ==============================================================================
 *
 * 1. TOTP SETUP (Google Authenticator / Authy):
 *    Logged-in user -> POST /api/v1/auth/2fa/setup-totp
 *    -> Generates RFC 6238 Base32 secret
 *    -> Renders high-resolution QR code as Data URL
 *    -> Temporarily saves AES-256-GCM encrypted secret on user
 *    -> Returns { qrCodeDataUrl, secret }
 *
 * 2. TOTP ENABLE / CONFIRM:
 *    User scans QR code, enters 6-digit code -> POST /api/v1/auth/2fa/enable-totp { code }
 *    -> Verifies 6-digit code with time window tolerance
 *    -> Sets twoFactorEnabled = true, twoFactorMethod = 'totp'
 *    -> Generates 8 one-time backup recovery codes (hashed before DB storage)
 *    -> Returns { backupCodes } to display ONCE to user and emails a copy
 *
 * 3. EMAIL OTP 2FA (Alternative Method):
 *    User selects Email OTP -> POST /api/v1/auth/2fa/send-email-otp
 *    -> Generates 6-digit random number, hashes with SHA-256 (10m expiration)
 *    -> Sends styled HTML email with code
 *    -> User submits code to /api/v1/auth/2fa/enable-email -> Enables Email 2FA
 *
 * 4. LOGIN 2FA CHALLENGE VERIFICATION:
 *    User logs in with password -> Server responds with mfaTicket (5m lifespan)
 *    User navigates to /login/2fa -> Submits { mfaTicket, code, method }
 *    -> POST /api/v1/auth/2fa/verify-challenge
 *    -> Rate limiter prevents brute-force code guessing (max 5 tries / 15m)
 *    -> Verifies mfaTicket JWT signature
 *    -> If method is 'totp': verifies against decrypted TOTP secret
 *    -> If method is 'email': verifies against unexpired emailOtpHash
 *    -> If method is 'backup': finds unused code, hashes, compares, and BURNS it
 *    -> On successful verification:
 *       -> Generates full Access Token (JWT, 15m)
 *       -> Generates persistent Refresh Token in DB & sets HTTP-only cookie
 *       -> Returns 200 OK with session data
 * ==============================================================================
 */

import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {
  generateTotpSetup,
  verifyTotpCode,
  sendEmailOtp as dispatchEmailOtp,
  verifyEmailOtp,
  setupBackupCodes,
  verifyAndBurnBackupCode,
} from '../services/twoFactorService.js';
import {
  verifyMfaTicket,
  generateAccessToken,
  createRefreshToken,
  setRefreshTokenCookie,
} from '../services/tokenService.js';
import { getUserEffectivePermissions } from '../middleware/rbacMiddleware.js';
import { TWO_FACTOR_METHODS } from '../config/constants.js';

// Temporary cache for in-progress TOTP setups (userId -> encryptedSecret)
const pendingTotpSecrets = new Map();

/**
 * Step 1: Initialize Google Authenticator (TOTP) setup
 * Route: POST /api/v1/auth/2fa/setup-totp (Authenticated)
 */
export const setupTotp = async (req, res, next) => {
  try {
    const user = req.user;

    const { secret, qrCodeDataUrl, encryptedSecret } =
      await generateTotpSetup(user.email);

    // Keep encrypted secret in memory pending user's verification submission
    pendingTotpSecrets.set(user._id.toString(), encryptedSecret);

    return ApiResponse.success(
      res,
      'Scan the QR code with Google Authenticator or enter the secret key manually.',
      {
        qrCodeDataUrl,
        manualEntryKey: secret,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verify code and activate TOTP 2FA
 * Route: POST /api/v1/auth/2fa/enable-totp (Authenticated)
 */
export const enableTotp = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user._id.toString();

    if (!code || code.trim().length !== 6) {
      return ApiResponse.error(res, 'Please provide a valid 6-digit TOTP code.', 400);
    }

    const pendingEncryptedSecret = pendingTotpSecrets.get(userId);
    if (!pendingEncryptedSecret) {
      return ApiResponse.error(
        res,
        'No pending 2FA setup found. Please restart the setup process.',
        400
      );
    }

    // Verify submitted code
    const isValid = verifyTotpCode(code.trim(), pendingEncryptedSecret);
    if (!isValid) {
      return ApiResponse.error(
        res,
        'Invalid verification code. Please check your authenticator app and try again.',
        400
      );
    }

    // Save encrypted secret and enable 2FA on user document
    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');
    user.twoFactorEnabled = true;
    user.twoFactorMethod = TWO_FACTOR_METHODS.TOTP;
    user.twoFactorSecret = pendingEncryptedSecret;

    // Generate emergency backup recovery codes
    const backupCodes = await setupBackupCodes(user, true);

    // Clean up temporary in-memory setup cache
    pendingTotpSecrets.delete(userId);

    return ApiResponse.success(
      res,
      'Two-Factor Authentication (Google Authenticator) enabled successfully! Save your backup codes.',
      {
        twoFactorEnabled: true,
        twoFactorMethod: TWO_FACTOR_METHODS.TOTP,
        backupCodes,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatch an Email OTP for setup or login challenge
 * Route: POST /api/v1/auth/2fa/send-email-otp
 */
export const requestEmailOtp = async (req, res, next) => {
  try {
    let user = req.user;

    // If unauthenticated (e.g. login challenge), authenticate via mfaTicket
    if (!user && req.body.mfaTicket) {
      const decoded = verifyMfaTicket(req.body.mfaTicket);
      user = await User.findById(decoded.sub).select('+emailOtpHash +emailOtpExpires');
    }

    if (!user) {
      return ApiResponse.unauthorized(res, 'Unable to identify user for OTP delivery.');
    }

    await dispatchEmailOtp(user);

    return ApiResponse.success(
      res,
      `A 6-digit security code has been sent to ${user.email}.`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Enable Email-based OTP as the primary 2FA method
 * Route: POST /api/v1/auth/2fa/enable-email (Authenticated)
 */
export const enableEmail2fa = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select(
      '+emailOtpHash +emailOtpExpires +twoFactorBackupCodes'
    );

    if (!code || code.trim().length !== 6) {
      return ApiResponse.error(res, 'Please provide a valid 6-digit code.', 400);
    }

    const isValid = await verifyEmailOtp(user, code.trim());
    if (!isValid) {
      return ApiResponse.error(res, 'Invalid or expired OTP code.', 400);
    }

    user.twoFactorEnabled = true;
    user.twoFactorMethod = TWO_FACTOR_METHODS.EMAIL;
    user.twoFactorSecret = undefined;

    const backupCodes = await setupBackupCodes(user, true);

    return ApiResponse.success(
      res,
      'Two-Factor Authentication (Email OTP) enabled successfully!',
      {
        twoFactorEnabled: true,
        twoFactorMethod: TWO_FACTOR_METHODS.EMAIL,
        backupCodes,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Disable Two-Factor Authentication
 * Route: POST /api/v1/auth/2fa/disable (Authenticated)
 */
export const disable2fa = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return ApiResponse.error(res, 'Password is required to disable 2FA.', 400);
    }

    const user = await User.findById(req.user._id).select('+password +twoFactorSecret');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Incorrect password. Cannot disable 2FA.', 400);
    }

    user.twoFactorEnabled = false;
    user.twoFactorMethod = null;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    user.emailOtpHash = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return ApiResponse.success(res, 'Two-Factor Authentication has been disabled.');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify 2FA code during login challenge (TOTP, Email OTP, or Backup Code)
 * Route: POST /api/v1/auth/2fa/verify-challenge (Public with mfaTicket)
 */
export const verifyLoginChallenge = async (req, res, next) => {
  try {
    const { mfaTicket, code, method } = req.body;

    if (!mfaTicket || !code) {
      return ApiResponse.error(
        res,
        'Both MFA ticket and verification code are required.',
        400
      );
    }

    // 1. Verify MFA Ticket
    let decoded;
    try {
      decoded = verifyMfaTicket(mfaTicket);
    } catch (err) {
      return ApiResponse.unauthorized(
        res,
        'MFA session ticket expired or invalid. Please log in again.'
      );
    }

    // 2. Fetch User with security fields
    const user = await User.findById(decoded.sub).select(
      '+twoFactorSecret +twoFactorBackupCodes +emailOtpHash +emailOtpExpires'
    );

    if (!user || !user.twoFactorEnabled) {
      return ApiResponse.error(res, '2FA is not enabled or user not found.', 400);
    }

    let isVerified = false;

    // 3. Verify based on method submitted
    if (method === 'backup') {
      // Emergency backup recovery code
      isVerified = await verifyAndBurnBackupCode(user, code);
    } else if (method === TWO_FACTOR_METHODS.EMAIL) {
      // 6-digit email OTP
      isVerified = await verifyEmailOtp(user, code.trim());
    } else {
      // Default: Google Authenticator TOTP
      isVerified = verifyTotpCode(code.trim(), user.twoFactorSecret);
    }

    if (!isVerified) {
      return ApiResponse.unauthorized(
        res,
        'Invalid verification code. Please try again.'
      );
    }

    // 4. Code verified: Issue full Access & Refresh Tokens
    const permissions = await getUserEffectivePermissions(user);
    const accessToken = generateAccessToken(user, permissions);

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || 'Unknown';

    const { rawToken: refreshToken } = await createRefreshToken(
      user._id,
      null, // Fresh token family
      userAgent,
      ipAddress
    );

    setRefreshTokenCookie(res, refreshToken);

    return ApiResponse.success(
      res,
      'Two-factor authentication successful! Logged in.',
      {
        accessToken,
        user: user.toSafeObject(),
        permissions,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate emergency backup recovery codes
 * Route: POST /api/v1/auth/2fa/backup-codes (Authenticated)
 */
export const regenerateBackupCodes = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password +twoFactorBackupCodes');

    if (!user.twoFactorEnabled) {
      return ApiResponse.error(
        res,
        'Two-factor authentication must be enabled to generate backup codes.',
        400
      );
    }

    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return ApiResponse.error(res, 'Incorrect password.', 400);
      }
    }

    const backupCodes = await setupBackupCodes(user, true);

    return ApiResponse.success(
      res,
      'New backup recovery codes generated. Previous codes are now invalid.',
      { backupCodes }
    );
  } catch (error) {
    next(error);
  }
};
