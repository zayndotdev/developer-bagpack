/**
 * ==============================================================================
 * 📍 FILE: src/controllers/passwordController.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Controller Layer -> Password Recovery & Credential Modification
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `src/routes/authRoutes.js`
 * - Delegates to:
 *   - `src/services/cryptoService.js` (Token generation, SHA-256 hashing)
 *   - `src/services/emailService.js` (Password reset email delivery)
 *   - `src/services/tokenService.js` (Revokes all active sessions on password change)
 * - Interacts with:
 *   - `src/models/User.js`
 *   - `src/utils/apiResponse.js`
 *
 * ==============================================================================
 * 🔄 END-TO-END FLOW: PASSWORD RECOVERY & RESET
 * ==============================================================================
 *
 * 1. FORGOT PASSWORD:
 *    User enters email -> POST /api/v1/auth/forgot-password { email }
 *    -> Rate limiter checks IP
 *    -> Finds user by email
 *    -> Generates 32-byte cryptographically random reset token
 *    -> Hashes token with SHA-256 and stores on user document with 1-hour expiration
 *    -> Dispatches branded HTML email with reset link containing raw token
 *    -> Always responds with generic success message to prevent email enumeration
 *
 * 2. RESET PASSWORD:
 *    User submits new password -> POST /api/v1/auth/reset-password/:token { password }
 *    -> Hashes incoming raw token with SHA-256
 *    -> Queries MongoDB for user with matching hash and unexpired timestamp
 *    -> Sets new password (User schema pre-save hook handles bcrypt hashing)
 *    -> Clears reset token hashes
 *    -> 🔒 SECURITY: Revokes ALL existing refresh tokens across all devices
 *    -> Responds with 200 OK (User can now log in with new password)
 *
 * 3. CHANGE PASSWORD (Authenticated):
 *    Logged in user -> POST /api/v1/auth/change-password { currentPassword, newPassword }
 *    -> verifyAuth middleware provides req.user
 *    -> Verifies currentPassword using bcrypt.compare()
 *    -> Updates password field
 *    -> 🔒 SECURITY: Revokes all other active refresh tokens
 *    -> Responds with 200 OK
 * ==============================================================================
 */

import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateRandomToken, hashToken } from '../services/cryptoService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { revokeAllUserTokens } from '../services/tokenService.js';
import { SECURITY_CONFIG } from '../config/constants.js';

/**
 * Initiate password reset flow by emailing a one-time secure link.
 * Route: POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Privacy safeguard: Always return success even if user doesn't exist
    // to prevent email harvesting / enumeration attacks
    if (!user) {
      return ApiResponse.success(
        res,
        'If an account with that email exists, a password reset link has been sent.'
      );
    }

    // Generate random 32-byte token and its SHA-256 hash
    const rawResetToken = generateRandomToken(32);
    user.passwordResetTokenHash = hashToken(rawResetToken);
    user.passwordResetExpires = new Date(
      Date.now() + SECURITY_CONFIG.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000
    );
    await user.save();

    // Dispatch styled HTML reset email
    await sendPasswordResetEmail(user.email, user.name, rawResetToken);

    return ApiResponse.success(
      res,
      'If an account with that email exists, a password reset link has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Complete password reset using the token from the email link.
 * Route: POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return ApiResponse.error(res, 'Reset token is missing.', 400);
    }

    const tokenHash = hashToken(token);

    // Look up user with matching unexpired reset token
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');

    if (!user) {
      return ApiResponse.error(
        res,
        'Password reset link is invalid or has expired. Please request a new one.',
        400
      );
    }

    // Update password (pre-save hook will hash it with bcrypt 12 rounds)
    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all active refresh sessions to lock out potential intruders
    await revokeAllUserTokens(user._id);

    return ApiResponse.success(
      res,
      'Password has been reset successfully! You can now log in with your new password.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Change password while already authenticated.
 * Route: POST /api/v1/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Retrieve user including password hash
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return ApiResponse.notFound(res, 'User account not found.');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.error(res, 'Incorrect current password.', 400, {
        currentPassword: 'The current password provided is incorrect.',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all other active sessions for this account as a security best practice
    await revokeAllUserTokens(user._id);

    return ApiResponse.success(
      res,
      'Password changed successfully! Other active sessions have been signed out.'
    );
  } catch (error) {
    next(error);
  }
};
