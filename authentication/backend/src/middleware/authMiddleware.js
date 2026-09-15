/**
 * ==============================================================================
 * 📍 FILE: src/middleware/authMiddleware.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Middleware Layer -> Access Token Verification & Identity Extraction
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on:
 *   - `src/routes/userRoutes.js` (All routes require verified access token)
 *   - `src/routes/twoFactorRoutes.js` (Setup, enable, disable 2FA)
 *   - `src/routes/roleRoutes.js` (Role management)
 *   - `src/routes/authRoutes.js` (Change password, logout, profile)
 * - Interacts with:
 *   - `src/services/tokenService.js` (Verifies JWT access token)
 *   - `src/models/User.js` (Loads user document)
 *   - `src/utils/apiResponse.js` (Sends 401 Unauthorized responses)
 *
 * 💡 WHY THIS EXISTS:
 * Protects private endpoints by intercepting incoming requests, extracting the
 * `Authorization: Bearer <token>` header, verifying its signature, and attaching
 * the authenticated user object to `req.user`.
 * ==============================================================================
 */

import { verifyAccessToken } from '../services/tokenService.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Middleware that validates the incoming short-lived JWT Access Token.
 * Attaches the authenticated Mongoose user document to `req.user`.
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // Check presence of 'Bearer <token>'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(
        res,
        'Access denied: No authorization bearer token provided.'
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(
          res,
          'Access token has expired. Please refresh your session.'
        );
      }
      return ApiResponse.unauthorized(res, 'Invalid or corrupted access token.');
    }

    // Retrieve active user from database to ensure account is not deleted or banned
    const user = await User.findById(decoded.sub);
    if (!user) {
      return ApiResponse.unauthorized(
        res,
        'Authentication failed: User account no longer exists.'
      );
    }

    // Check account lockout
    if (user.isLocked()) {
      return ApiResponse.forbidden(
        res,
        'Account is temporarily locked due to excessive failed attempts. Try again later.'
      );
    }

    // Attach user and decoded token claims to Express request context
    req.user = user;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware:
 * If an Authorization Bearer token is provided, validates it and attaches req.user.
 * If no token is provided, passes through silently (for endpoints supporting both authenticated and ticket-based unauthenticated callers).
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.sub);
        if (user && !user.isLocked()) {
          req.user = user;
          req.tokenPayload = decoded;
        }
      } catch {
        // Soft fail for optional auth (e.g. token expired, unauthenticated login challenge)
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

