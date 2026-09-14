/**
 * ==============================================================================
 * 📍 FILE: src/utils/validators.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Utility Layer -> Client-Side Form Validation & Password Strength Scorer
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/pages/auth/SignUpPage.jsx`
 *   - `src/pages/auth/ResetPasswordPage.jsx`
 *   - `src/pages/settings/ChangePasswordPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Client-side validation gives immediate feedback before submitting to the network,
 * while matching the exact validation rules enforced by the backend API.
 * ==============================================================================
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email structure.
 */
export const isValidEmail = (email) => {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
};

/**
 * Checks whether password meets minimum security criteria:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 */
export const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

/**
 * Calculates a dynamic 0-4 password strength score and descriptive label.
 */
export const getPasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: 'None', color: 'bg-slate-200' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    case 2:
      return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Good', color: 'bg-indigo-500' };
    case 4:
      return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
    default:
      return { score: 0, label: 'Very Weak', color: 'bg-rose-400' };
  }
};
