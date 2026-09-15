/**
 * ==============================================================================
 * 📍 FILE: src/controllers/sessionController.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Controller Layer -> Active Devices & Session Telemetry Management
 *
 * 💡 WHY THIS EXISTS:
 * Provides Clerk-style session visibility and remote device sign-out:
 * 1. listSessions: Lists all active refresh sessions with parsed OS, browser, IP.
 * 2. revokeSession: Revokes a specific remote device session.
 * 3. revokeOtherSessions: Signs out of all other devices while preserving current session.
 * ==============================================================================
 */

import { RefreshToken } from '../models/RefreshToken.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { COOKIE_NAMES } from '../config/constants.js';
import { hashToken } from '../services/cryptoService.js';

export const parseUserAgent = (uaString = '') => {
  const ua = uaString.toLowerCase();

  // OS Detection
  let os = 'Windows';
  if (ua.includes('windows nt 10.0') || ua.includes('windows nt 11.0') || ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    os = 'macOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    os = 'iOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // Browser Detection
  let browser = 'Chrome';
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome/') && !ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('postman') || ua.includes('curl')) {
    browser = 'API Client';
  }

  // Device Type Detection
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('ipad') || ua.includes('tablet')) {
    device = 'Tablet';
  }

  return { os, browser, device };
};

/**
 * List all active sessions for current user
 * Route: GET /api/v1/auth/sessions
 */
export const listSessions = async (req, res, next) => {
  try {
    const rawCookieToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    const currentHash = rawCookieToken ? hashToken(rawCookieToken) : null;

    // Find all active, unexpired tokens
    const tokens = await RefreshToken.find({
      userId: req.user._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ updatedAt: -1 });

    // Identify current token by hash or family
    let currentTokenId = null;
    if (currentHash) {
      const activeMatch = tokens.find((t) => t.tokenHash === currentHash);
      if (activeMatch) {
        currentTokenId = activeMatch._id.toString();
      }
    }

    // Fallback: If no cookie match found, mark the newest session as current
    if (!currentTokenId && tokens.length > 0) {
      currentTokenId = tokens[0]._id.toString();
    }

    const sessions = tokens.map((token) => {
      const parsed = parseUserAgent(token.userAgent);
      const isCurrent = token._id.toString() === currentTokenId;

      return {
        _id: token._id,
        device: parsed.device,
        os: parsed.os,
        browser: parsed.browser,
        ip: token.ipAddress === '::1' || token.ipAddress === '127.0.0.1' ? 'Localhost (Dev)' : token.ipAddress,
        isCurrent,
        createdAt: token.createdAt,
        lastActive: token.updatedAt || token.createdAt,
      };
    });

    return ApiResponse.success(res, 'Active sessions retrieved successfully.', {
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke a specific session by ID
 * Route: DELETE /api/v1/auth/sessions/:sessionId
 */
export const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const token = await RefreshToken.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!token) {
      return ApiResponse.notFound(res, 'Session not found or already revoked.');
    }

    token.isRevoked = true;
    await token.save();

    return ApiResponse.success(res, 'Session revoked successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke all other sessions except current
 * Route: DELETE /api/v1/auth/sessions
 */
export const revokeOtherSessions = async (req, res, next) => {
  try {
    const rawCookieToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    const currentHash = rawCookieToken ? hashToken(rawCookieToken) : null;

    let currentSessionId = null;
    if (currentHash) {
      const currentDoc = await RefreshToken.findOne({
        userId: req.user._id,
        tokenHash: currentHash,
      });
      if (currentDoc) currentSessionId = currentDoc._id;
    }

    const query = {
      userId: req.user._id,
      isRevoked: false,
    };

    if (currentSessionId) {
      query._id = { $ne: currentSessionId };
    }

    const result = await RefreshToken.updateMany(query, {
      $set: { isRevoked: true },
    });

    return ApiResponse.success(
      res,
      `Successfully signed out of ${result.modifiedCount} other device(s).`
    );
  } catch (error) {
    next(error);
  }
};
