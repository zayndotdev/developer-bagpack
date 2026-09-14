/**
 * ==============================================================================
 * 📍 FILE: src/middleware/rateLimiters.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Middleware Layer -> Endpoint Rate Limiting & DoS / Brute-Force Throttling
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on:
 *   - `src/routes/authRoutes.js` (Login, Signup, Forgot Password, Resend Verification)
 *   - `src/routes/twoFactorRoutes.js` (2FA Challenge Verification & Email OTP Dispatch)
 * - Interacts with:
 *   - `src/utils/apiResponse.js` (Sends standard 429 Too Many Requests response)
 *   - `express-rate-limit`
 *
 * 💡 WHY THIS EXISTS:
 * Rate limiting protects public authentication endpoints against brute-force
 * password guessing, credential stuffing, and email spamming (bombing).
 * ==============================================================================
 */

import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Standard handler that produces a uniform ApiResponse JSON on rate limit trigger.
 */
const createRateLimitHandler = (message) => (req, res) => {
  return ApiResponse.tooManyRequests(res, message);
};

/**
 * Login Rate Limiter: Max 5 attempts per 15 minutes per IP in production.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Too many login attempts from this IP. Please try again after 15 minutes.'
  ),
});

/**
 * Sensitive Action Limiter: Used for Forgot Password and Resend Verification Email.
 * Max 3 requests per 15 minutes per IP in production.
 */
export const emailActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Too many email requests sent. Please wait 15 minutes before requesting another.'
  ),
});

/**
 * 2FA Challenge Limiter: Max 5 attempts per 15 minutes per IP in production.
 */
export const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Too many 2FA verification attempts. Please wait 15 minutes before trying again.'
  ),
});

/**
 * Account Registration Limiter: Max 5 registrations per hour per IP in production.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Too many accounts created from this IP. Please try again later.'
  ),
});
