/**
 * ==============================================================================
 * 📍 FILE: src/config/env.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Configuration Layer -> Environment Loader & Validator
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `server.js` (Initializes env check before starting HTTP server)
 *   - `src/config/db.js` (Reads MONGODB_URI)
 *   - `src/config/mailer.js` (Reads SMTP configuration)
 *   - `src/services/tokenService.js` (Reads JWT secrets & expiration times)
 *   - `src/services/cryptoService.js` (Reads ENCRYPTION_KEY)
 *
 * 💡 WHY THIS EXISTS:
 * "Fail fast" principle: Crashing at startup when essential secrets or database
 * URIs are missing prevents subtle runtime authentication failures in production.
 * It also centralizes all process.env access into a clean, typed-like config object.
 * ==============================================================================
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validates that essential environment variables are present.
 * In development, provides safe defaults so a new developer can run the project immediately.
 */
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, enforce strict secrets
  if (isProduction) {
    const required = [
      'MONGODB_URI',
      'JWT_ACCESS_SECRET',
      'JWT_MFA_SECRET',
      'ENCRYPTION_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `🚨 [CRITICAL CONFIG ERROR] Missing required environment variables in production: ${missing.join(', ')}`
      );
    }

    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
      throw new Error(
        '🚨 [CONFIG ERROR] ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).'
      );
    }
  }
};

validateEnv();

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database
  MONGODB_URI:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/developer_backpack_auth',

  // JWT configuration
  JWT: {
    ACCESS_SECRET:
      process.env.JWT_ACCESS_SECRET ||
      'backpack_super_secret_access_jwt_key_development_only_min_32_chars!',
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    MFA_SECRET:
      process.env.JWT_MFA_SECRET ||
      'backpack_super_secret_mfa_ticket_key_development_only_min_32_chars!',
    MFA_EXPIRES_IN: process.env.JWT_MFA_EXPIRES_IN || '5m',
    REFRESH_DAYS: parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 7,
  },

  // AES-256-GCM Encryption key (64 hex characters = 32 bytes)
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',

  // SMTP Email
  SMTP: {
    HOST: process.env.SMTP_HOST || '',
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM:
      process.env.SMTP_FROM ||
      '"Developer Backpack" <no-reply@developerbackpack.dev>',
  },
});
