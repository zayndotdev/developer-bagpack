/**
 * ==============================================================================
 * 📍 FILE: src/middleware/validateMiddleware.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Middleware Layer -> Request Body Validation & Input Sanitization
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on:
 *   - `src/routes/authRoutes.js`
 *   - `src/routes/twoFactorRoutes.js`
 * - Interacts with:
 *   - `src/utils/apiResponse.js` (Sends 422 Unprocessable Entity on validation failure)
 *
 * 💡 WHY THIS EXISTS:
 * Validating incoming data at the route boundary ensures malicious or malformed
 * inputs never reach business logic or database queries, providing clean error
 * messages to the client.
 * ==============================================================================
 */

import { ApiResponse } from '../utils/apiResponse.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates user signup payload: name, email, password
 */
export const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required.';
  } else if (name.trim().length > 60) {
    errors.name = 'Name cannot exceed 60 characters.';
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'A valid email address is required.';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.password =
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
  }

  if (Object.keys(errors).length > 0) {
    return ApiResponse.error(res, 'Validation failed', 422, errors);
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validates login payload: email, password
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'A valid email address is required.';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return ApiResponse.error(res, 'Validation failed', 422, errors);
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validates email-only forms (e.g. forgot password, resend verification)
 */
export const validateEmailOnly = (req, res, next) => {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return ApiResponse.error(res, 'Validation failed', 422, {
      email: 'A valid email address is required.',
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validates password reset payload
 */
export const validateResetPassword = (req, res, next) => {
  const { password } = req.body || {};

  if (!password || typeof password !== 'string' || password.length < 8) {
    return ApiResponse.error(res, 'Validation failed', 422, {
      password: 'Password must be at least 8 characters long.',
    });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return ApiResponse.error(res, 'Validation failed', 422, {
      password:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    });
  }

  next();
};

/**
 * Validates password change payload (authenticated)
 */
export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {};
  const errors = {};

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.currentPassword = 'Current password is required.';
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters long.';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    errors.newPassword =
      'New password must contain at least one uppercase letter, one lowercase letter, and one number.';
  }

  if (currentPassword === newPassword) {
    errors.newPassword = 'New password cannot be the same as your current password.';
  }

  if (Object.keys(errors).length > 0) {
    return ApiResponse.error(res, 'Validation failed', 422, errors);
  }

  next();
};
