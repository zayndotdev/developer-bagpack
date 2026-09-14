/**
 * ==============================================================================
 * 📍 FILE: src/controllers/authController.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Controller Layer -> Primary Authentication Lifecycle Handler
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `src/routes/authRoutes.js`
 * - Delegates to:
 *   - `src/services/tokenService.js` (Access/Refresh token generation, rotation, cookies)
 *   - `src/services/cryptoService.js` (Token hashing with SHA-256)
 *   - `src/services/emailService.js` (Verification email delivery)
 *   - `src/middleware/rbacMiddleware.js` (Resolves user permissions for JWT claims)
 * - Interacts with:
 *   - `src/models/User.js`
 *   - `src/utils/apiResponse.js`
 *
 * ==============================================================================
 * 🔄 END-TO-END FLOW: AUTHENTICATION LIFECYCLE
 * ==============================================================================
 *
 * 1. SIGN UP:
 *    Client -> POST /api/v1/auth/signup { name, email, password }
 *    -> validateSignup middleware verifies inputs
 *    -> Controller checks for existing user (prevents duplicates)
 *    -> Generates 32-byte cryptographically random verification token
 *    -> Hashes token with SHA-256 and saves to MongoDB (with 24h expiration)
 *    -> Hashes password via User schema pre-save hook (bcrypt 12 rounds)
 *    -> Dispatches styled HTML verification email with activation link
 *    -> Returns 201 Created (user must verify email before full login)
 *
 * 2. EMAIL VERIFICATION:
 *    User clicks email link -> GET /api/v1/auth/verify-email?token=...&email=...
 *    -> Controller hashes incoming token and searches for matching user
 *    -> Verifies token expiration
 *    -> Marks isEmailVerified = true, clears token hashes
 *    -> Returns 200 OK with success confirmation
 *
 * 3. LOGIN:
 *    Client -> POST /api/v1/auth/login { email, password }
 *    -> Rate limiter checks IP (max 5 tries / 15m)
 *    -> Finds user by email (explicitly selecting +password)
 *    -> Checks brute-force lock (isLocked)
 *    -> bcrypt compares password; on failure: increments failed attempts
 *    -> If email is unverified -> Rejects with 403 (prompting verification)
 *    -> Resets failed attempts to 0
 *    -> IF TWO-FACTOR AUTH IS ENABLED:
 *       -> Pauses flow! Does NOT issue full tokens yet.
 *       -> Issues a short-lived 5-minute signed mfaTicket.
 *       -> Returns { requires2FA: true, mfaTicket, method: 'totp' | 'email' }
 *    -> IF TWO-FACTOR AUTH IS NOT ENABLED:
 *       -> Generates short-lived Access Token (JWT, 15m)
 *       -> Generates long-lived Refresh Token (stored in MongoDB under unique familyId)
 *       -> Attaches Refresh Token to HTTP-only, SameSite cookie
 *       -> Returns 200 OK with Access Token and User profile
 *
 * 4. TOKEN REFRESH (Silent Background Persistence):
 *    Client Axios interceptor gets 401 -> POST /api/v1/auth/refresh
 *    -> Reads HTTP-only refresh cookie
 *    -> Checks database for matching token hash
 *    -> IF TOKEN REUSE DETECTED (already revoked):
 *       -> Alerts security! Revokes entire family lineage in DB. Returns 403 Forbidden.
 *    -> IF VALID:
 *       -> Marks old token revoked, creates successor token under same familyId
 *       -> Issues new 15m Access Token
 *       -> Updates HTTP-only cookie with new Refresh Token
 *       -> Returns 200 OK
 *
 * 5. LOGOUT:
 *    Client -> POST /api/v1/auth/logout
 *    -> Revokes Refresh Token in database
 *    -> Clears HTTP-only cookie
 *    -> Returns 200 OK
 * ==============================================================================
 */

import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {
  generateRandomToken,
  hashToken,
} from '../services/cryptoService.js';
import {
  generateAccessToken,
  generateMfaTicket,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../services/tokenService.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { getUserEffectivePermissions } from '../middleware/rbacMiddleware.js';
import { COOKIE_NAMES, SECURITY_CONFIG } from '../config/constants.js';

/**
 * Register a new user account
 * Route: POST /api/v1/auth/signup
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(
        res,
        'An account with this email already exists.',
        409,
        { email: 'Email is already registered.' }
      );
    }

    // Generate random verification token and its SHA-256 hash
    const rawVerificationToken = generateRandomToken(32);
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationExpires = new Date(
      Date.now() + SECURITY_CONFIG.EMAIL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Create user in database
    const user = await User.create({
      name,
      email,
      password, // Hashed automatically by User pre-save hook
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, rawVerificationToken);

    return ApiResponse.created(
      res,
      'Registration successful! Please check your email to verify your account before logging in.',
      {
        user: user.toSafeObject(),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify account email address using token from email link
 * Route: POST /api/v1/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return ApiResponse.error(res, 'Verification token and email are required.', 400);
    }

    const tokenHash = hashToken(token);

    // Find user with matching email, active verification token hash, and unexpired token
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationTokenHash +emailVerificationExpires');

    if (!user) {
      return ApiResponse.error(
        res,
        'Invalid or expired verification link. Please request a new one.',
        400
      );
    }

    // Mark verified and clear verification tokens
    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return ApiResponse.success(
      res,
      'Your email has been verified successfully! You may now log in.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend email verification link
 * Route: POST /api/v1/auth/resend-verification
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // For privacy, return generic success even if user not found
    if (!user) {
      return ApiResponse.success(
        res,
        'If an unverified account exists for that email, a verification link has been sent.'
      );
    }

    if (user.isEmailVerified) {
      return ApiResponse.error(res, 'This account has already been verified.', 400);
    }

    // Generate fresh verification token
    const rawVerificationToken = generateRandomToken(32);
    user.emailVerificationTokenHash = hashToken(rawVerificationToken);
    user.emailVerificationExpires = new Date(
      Date.now() + SECURITY_CONFIG.EMAIL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );
    await user.save();

    await sendVerificationEmail(user.email, user.name, rawVerificationToken);

    return ApiResponse.success(
      res,
      'A fresh verification email has been sent. Please check your inbox.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 * Route: POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user and explicitly include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid email or password.');
    }

    // Check account brute-force lock
    if (user.isLocked()) {
      const minutesRemaining = Math.ceil(
        (user.lockUntil - Date.now()) / (60 * 1000)
      );
      return ApiResponse.forbidden(
        res,
        `Account locked due to excessive failed attempts. Please try again in ${minutesRemaining} minute(s).`
      );
    }

    // Verify password match via bcrypt
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      await user.incrementLoginAttempts();
      return ApiResponse.unauthorized(res, 'Invalid email or password.');
    }

    // Verify email activation status
    if (!user.isEmailVerified) {
      return ApiResponse.forbidden(
        res,
        'Your email address has not been verified yet. Please check your inbox or request a new verification link.'
      );
    }

    // Successful password match: reset failed login attempts counter
    await user.resetLoginAttempts();

    // --------------------------------------------------------------------------
    // 2FA CHECK: If 2FA is active, pause and issue temporary MFA ticket
    // --------------------------------------------------------------------------
    if (user.twoFactorEnabled) {
      const mfaTicket = generateMfaTicket(user);

      return ApiResponse.success(
        res,
        'Two-factor authentication required to complete login.',
        {
          requires2FA: true,
          mfaTicket,
          twoFactorMethod: user.twoFactorMethod,
        }
      );
    }

    // --------------------------------------------------------------------------
    // STANDARD LOGIN (No 2FA): Issue Access + Refresh Token pair
    // --------------------------------------------------------------------------
    const permissions = await getUserEffectivePermissions(user);
    const accessToken = generateAccessToken(user, permissions);

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';

    const { rawToken: refreshToken } = await createRefreshToken(
      user._id,
      null, // Fresh token family
      userAgent,
      ipAddress
    );

    // Set secure HTTP-only refresh cookie
    setRefreshTokenCookie(res, refreshToken);

    return ApiResponse.success(res, 'Login successful!', {
      requires2FA: false,
      accessToken,
      user: user.toSafeObject(),
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rotate Refresh Token and issue new Access Token
 * Route: POST /api/v1/auth/refresh
 */
export const refreshSession = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (!rawRefreshToken) {
      return ApiResponse.unauthorized(
        res,
        'Refresh token missing. Please log in again.'
      );
    }

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || 'Unknown';

    // Perform rotation (includes automated reuse breach detection)
    const { newRawToken, userId } = await rotateRefreshToken(
      rawRefreshToken,
      userAgent,
      ipAddress
    );

    const user = await User.findById(userId);
    if (!user) {
      return ApiResponse.unauthorized(res, 'User session is no longer active.');
    }

    const permissions = await getUserEffectivePermissions(user);
    const accessToken = generateAccessToken(user, permissions);

    // Update refresh cookie with the rotated token
    setRefreshTokenCookie(res, newRawToken);

    return ApiResponse.success(res, 'Session refreshed successfully.', {
      accessToken,
      user: user.toSafeObject(),
      permissions,
    });
  } catch (error) {
    // If token reuse breach or invalid token, clear the cookie
    clearRefreshTokenCookie(res);
    next(error);
  }
};

/**
 * Log out user: Revoke active refresh token and clear cookie
 * Route: POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (rawRefreshToken) {
      await revokeRefreshToken(rawRefreshToken);
    }

    clearRefreshTokenCookie(res);

    return ApiResponse.success(res, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * Route: GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const permissions = await getUserEffectivePermissions(req.user);

    return ApiResponse.success(res, 'User profile retrieved.', {
      user: req.user.toSafeObject(),
      permissions,
    });
  } catch (error) {
    next(error);
  }
};
