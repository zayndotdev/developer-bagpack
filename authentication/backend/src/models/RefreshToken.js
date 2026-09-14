/**
 * ==============================================================================
 * 📍 FILE: src/models/RefreshToken.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Data Layer (Mongoose Model) -> Persistent Refresh Tokens & Rotation Tracking
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/services/tokenService.js` (Creates, queries, rotates, and revokes tokens)
 *   - `src/controllers/authController.js` (Triggers token refresh and logout revocation)
 *
 * 💡 WHY THIS EXISTS:
 * Rather than only trusting a stateless JWT cookie, production-grade systems
 * store refresh tokens in a database to support:
 * 1. Immediate remote logout / session revocation.
 * 2. Token Rotation: Issuing a new refresh token with every refresh request.
 * 3. Token Reuse Detection: Tracking token "families" (lineage). If an attacker
 *    attempts to replay an old/revoked refresh token, the entire family is immediately
 *    invalidated, neutralizing the stolen session.
 * 4. Automatic TTL expiration cleanup using MongoDB's background index.
 * ==============================================================================
 */

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Cryptographic SHA-256 hash of the refresh token string
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Family ID tracks the lineage of rotating tokens originating from a single login
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    // If rotated, records which token succeeded this one
    replacedByTokenHash: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB TTL index: Document automatically deletes when expiresAt is reached
      index: { expires: 0 },
    },
    // Client telemetry for session visibility and security auditing
    userAgent: {
      type: String,
      default: 'Unknown Device',
    },
    ipAddress: {
      type: String,
      default: 'Unknown IP',
    },
  },
  {
    timestamps: true,
  }
);

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
