/**
 * ==============================================================================
 * 📍 FILE: src/services/tokenService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> Token Lifecycle, JWT Generation, Rotation & Reuse Detection
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/controllers/authController.js` (Login, Token Refresh, Logout, Email Verification)
 *   - `src/controllers/twoFactorController.js` (Issues final tokens upon 2FA challenge success)
 *   - `src/controllers/passwordController.js` (Revokes all tokens upon password reset)
 *   - `src/middleware/authMiddleware.js` (Verifies incoming Authorization bearer tokens)
 * - Interacts with:
 *   - `src/models/RefreshToken.js` (Persists and rotates refresh tokens)
 *   - `src/services/cryptoService.js` (Hashes tokens with SHA-256)
 *   - `src/config/constants.js` (Cookie names)
 *   - `src/config/env.js` (JWT secrets and expiration durations)
 *
 * 💡 WHY THIS EXISTS:
 * Implements a battle-tested token architecture:
 * 1. Short-Lived Access Tokens (15 min): Reduces the blast radius if an access token
 *    is intercepted over the wire or copied from memory.
 * 2. Long-Lived Refresh Tokens (7 days): Stored in database, delivered via HTTP-only cookie.
 * 3. Token Rotation: Every refresh yields a brand new access + refresh token pair.
 * 4. Reuse Detection (Token Family Lineage): If an already-rotated refresh token is
 *    submitted a second time, the system recognizes a token theft attempt and wipes
 *    the entire token family, logging out all devices associated with that session lineage.
 * ==============================================================================
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { COOKIE_NAMES } from '../config/constants.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { hashToken, generateRandomToken } from './cryptoService.js';
import { logger } from '../utils/logger.js';

// ==============================================================================
// 1. ACCESS TOKEN & MFA TICKET SIGNING
// ==============================================================================

/**
 * Signs a short-lived JSON Web Token (Access Token).
 * Contains minimal user claims: subject ID, role, and effective permissions.
 */
export const generateAccessToken = (user, permissions = []) => {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    permissions,
  };

  return jwt.sign(payload, env.JWT.ACCESS_SECRET, {
    expiresIn: env.JWT.ACCESS_EXPIRES_IN,
  });
};

/**
 * Signs a temporary, constrained MFA ticket issued after successful password check.
 * Cannot be used to access protected API resources; only valid for 2FA verification.
 */
export const generateMfaTicket = (user) => {
  const payload = {
    sub: user._id.toString(),
    purpose: 'mfa_challenge',
  };

  return jwt.sign(payload, env.JWT.MFA_SECRET, {
    expiresIn: env.JWT.MFA_EXPIRES_IN,
  });
};

/**
 * Verifies a short-lived Access Token.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT.ACCESS_SECRET);
};

/**
 * Verifies a temporary MFA Ticket during 2FA login challenge.
 */
export const verifyMfaTicket = (ticket) => {
  return jwt.verify(ticket, env.JWT.MFA_SECRET);
};

// ==============================================================================
// 2. REFRESH TOKEN LIFECYCLE & ROTATION
// ==============================================================================

/**
 * Creates and persists a new high-entropy Refresh Token document in MongoDB.
 * If no familyId is provided, generates a new family lineage (UUID).
 */
export const createRefreshToken = async (
  userId,
  familyId = null,
  userAgent = 'Unknown',
  ipAddress = 'Unknown'
) => {
  const rawToken = generateRandomToken(64);
  const tokenHash = hashToken(rawToken);
  const activeFamilyId = familyId || crypto.randomUUID();

  const expiresAt = new Date(
    Date.now() + env.JWT.REFRESH_DAYS * 24 * 60 * 60 * 1000
  );

  const refreshTokenDoc = await RefreshToken.create({
    userId,
    tokenHash,
    familyId: activeFamilyId,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return { rawToken, refreshTokenDoc };
};

/**
 * Rotates a refresh token:
 * 1. Checks if token exists and whether it is revoked.
 * 2. 🚨 REUSE DETECTION: If an already-revoked token is received, an attacker
 *    is replaying old tokens! Invalidate the entire familyId immediately.
 * 3. If valid: Revoke old token and issue a fresh one under the same familyId.
 */
export const rotateRefreshToken = async (rawToken, userAgent, ipAddress) => {
  const incomingHash = hashToken(rawToken);

  const existingToken = await RefreshToken.findOne({ tokenHash: incomingHash });

  // Case 1: Token does not exist at all
  if (!existingToken) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  // Case 2: 🚨 TOKEN REUSE DETECTED!
  // Someone is trying to use a token that was already rotated or revoked!
  if (existingToken.isRevoked) {
    logger.security(
      `🚨 REFRESH TOKEN REUSE DETECTED! Compromised Family: ${existingToken.familyId} | User: ${existingToken.userId}`
    );

    // Invalidate the ENTIRE token family to stop the attacker
    await RefreshToken.updateMany(
      { familyId: existingToken.familyId },
      { $set: { isRevoked: true } }
    );

    const breachError = new Error(
      'Security alert: Refresh token reuse detected. All active sessions in this family have been terminated.'
    );
    breachError.statusCode = 403;
    throw breachError;
  }

  // Case 3: Token expired
  if (existingToken.expiresAt < new Date()) {
    existingToken.isRevoked = true;
    await existingToken.save();

    const expiredError = new Error('Refresh token has expired. Please log in again.');
    expiredError.statusCode = 401;
    throw expiredError;
  }

  // Case 4: Token is valid -> Rotate it
  // Generate successor token within the same familyId
  const { rawToken: newRawToken, refreshTokenDoc: newDoc } =
    await createRefreshToken(
      existingToken.userId,
      existingToken.familyId,
      userAgent,
      ipAddress
    );

  // Mark the incoming token as revoked and link to its replacement
  existingToken.isRevoked = true;
  existingToken.replacedByTokenHash = newDoc.tokenHash;
  await existingToken.save();

  return {
    newRawToken,
    userId: existingToken.userId,
  };
};

/**
 * Revokes a single refresh token (typically used during manual user logout).
 */
export const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { isRevoked: true } });
};

/**
 * Revokes ALL active refresh tokens for a user (used on password change or account compromise).
 */
export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } });
};

// ==============================================================================
// 3. HTTP COOKIE MANAGEMENT
// ==============================================================================

/**
 * Attaches the Refresh Token as a secure, HTTP-only cookie to the response.
 */
export const setRefreshTokenCookie = (res, rawToken) => {
  const maxAgeMs = env.JWT.REFRESH_DAYS * 24 * 60 * 60 * 1000;

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, rawToken, {
    httpOnly: true, // Prevents JavaScript document.cookie access (XSS defense)
    secure: env.IS_PROD, // In production, requires HTTPS
    sameSite: env.IS_PROD ? 'strict' : 'lax', // CSRF defense
    maxAge: maxAgeMs,
    path: '/',
  });
};

/**
 * Clears the Refresh Token cookie on logout.
 */
export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: env.IS_PROD ? 'strict' : 'lax',
    path: '/',
  });
};
