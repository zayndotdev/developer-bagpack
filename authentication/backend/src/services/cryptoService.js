/**
 * ==============================================================================
 * 📍 FILE: src/services/cryptoService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> Cryptographic Operations & At-Rest Encryption
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/controllers/authController.js` (Hashes verification tokens, generates random tokens)
 *   - `src/controllers/passwordController.js` (Hashes reset tokens)
 *   - `src/controllers/twoFactorController.js` (Encrypts/decrypts TOTP secrets, generates backup codes)
 *   - `src/services/tokenService.js` (Hashes refresh tokens for database storage)
 *   - `src/services/twoFactorService.js` (Generates and hashes email OTPs)
 *
 * 💡 WHY THIS EXISTS:
 * Centralizes all low-level Node.js `crypto` module operations:
 * 1. SHA-256 Hashing: One-way hashing for tokens (email verification, password reset,
 *    and refresh tokens). Even if the database is leaked, an attacker cannot use the tokens.
 * 2. AES-256-GCM Encryption: Two-way authenticated encryption for TOTP secrets stored
 *    in the database. GCM mode includes an authentication tag (MAC) that prevents
 *    ciphertext tampering.
 * 3. CSPRNG: Cryptographically secure pseudo-random number generation for OTPs & backup codes.
 * ==============================================================================
 */

import crypto from 'crypto';
import { env } from '../config/env.js';

// AES-256-GCM configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 16;     // 128-bit initialization vector
const AUTH_TAG_LENGTH_BYTES = 16; // 128-bit authentication tag

/**
 * Computes an un-salted SHA-256 hexadecimal hash of any string.
 * Used for storing high-entropy random tokens (reset tokens, refresh tokens) in the database.
 * High-entropy random strings do not require bcrypt/Argon2 because brute-force dictionary
 * attacks are mathematically infeasible against 256 bits of entropy.
 */
export const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generates a cryptographically secure random hexadecimal token.
 */
export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generates a cryptographically secure numeric One-Time Password (OTP).
 * Default: 6 digits (range 100000 - 999999).
 */
export const generateNumericOtp = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

/**
 * Generates a set of human-friendly, uppercase alphanumeric backup codes.
 * Format: 8 characters split with a hyphen (e.g. "A7K2-9B1X").
 * Returns both the plaintext array (to show the user ONCE) and the hashed array (for DB storage).
 */
export const generateBackupCodes = (count = 8) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing 0/O, 1/I
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    let raw = '';
    const randomBytes = crypto.randomBytes(8);
    for (let j = 0; j < 8; j++) {
      raw += characters[randomBytes[j] % characters.length];
    }
    // Format as 4-4 with hyphen: "XXXX-XXXX"
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    plainCodes.push(formatted);
    hashedCodes.push({
      codeHash: hashToken(formatted),
      used: false,
      usedAt: null,
    });
  }

  return { plainCodes, hashedCodes };
};

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * The output format is: `ivHex:authTagHex:encryptedDataHex`.
 *
 * 🔒 Why AES-256-GCM?
 * Unlike older modes like CBC, GCM provides both confidentiality and authenticity.
 * If someone modifies even 1 bit of the encrypted secret in the database, decryption
 * will fail rather than silently producing garbage.
 */
export const encryptAesGcm = (text, keyHex = env.ENCRYPTION_KEY) => {
  if (!text) return null;
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Pack IV, AuthTag, and Encrypted ciphertext together separated by colons
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an AES-256-GCM payload string (`ivHex:authTagHex:encryptedDataHex`).
 */
export const decryptAesGcm = (encryptedPayload, keyHex = env.ENCRYPTION_KEY) => {
  if (!encryptedPayload) return null;
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload structure. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
