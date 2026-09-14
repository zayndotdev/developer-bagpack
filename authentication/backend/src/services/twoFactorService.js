/**
 * ==============================================================================
 * 📍 FILE: src/services/twoFactorService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> Two-Factor Authentication (TOTP, Email OTP & Backup Codes)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/controllers/twoFactorController.js` (Setup, enable, disable, and challenge verification)
 * - Interacts with:
 *   - `src/services/cryptoService.js` (AES-256-GCM encryption, SHA-256 hashing, backup code generation)
 *   - `src/services/emailService.js` (Sends Email OTPs and backup code recovery emails)
 *   - `src/models/User.js` (Updates 2FA flags, encrypted secrets, and backup codes)
 *   - `otplib` (RFC 6238 Time-based One-Time Password standard)
 *   - `qrcode` (Renders visual QR codes for Google Authenticator/Authy)
 *
 * 💡 WHY THIS EXISTS:
 * Two-Factor Authentication (2FA) is a cornerstone of modern security.
 * This service implements BOTH industry standards:
 * 1. TOTP (Google Authenticator / 1Password / Authy): Fully offline, client-side
 *    algorithmic time sync via RFC 6238. Secrets are encrypted at rest with AES-256-GCM.
 * 2. Email-Based OTP: A 6-digit one-time code delivered to the user's verified email.
 * 3. Emergency Backup Codes: 8 single-use recovery codes hashed before database persistence.
 * ==============================================================================
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import {
  encryptAesGcm,
  decryptAesGcm,
  hashToken,
  generateNumericOtp,
  generateBackupCodes,
} from './cryptoService.js';
import { sendOtpEmail, sendBackupCodesEmail } from './emailService.js';
import { SECURITY_CONFIG } from '../config/constants.js';

// Configure TOTP tolerance (allows 1 step before/after to account for clock drift)
authenticator.options = {
  window: 1, // 30-second window before/after (total 90 seconds tolerance)
};

const SERVICE_NAME = 'DeveloperBackpack';

// ==============================================================================
// 1. TOTP (GOOGLE AUTHENTICATOR) LIFECYCLE
// ==============================================================================

/**
 * Generates a fresh TOTP secret, otpauth:// URI, and a Base64 QR code image.
 * Returns the unencrypted secret (to display to user once) and the encrypted payload for DB.
 */
export const generateTotpSetup = async (userEmail) => {
  // Generate random Base32 secret string (RFC 4648)
  const secret = authenticator.generateSecret();

  // Create standard otpauth URL: otpauth://totp/DeveloperBackpack:user@example.com?secret=...&issuer=...
  const otpAuthUrl = authenticator.keyuri(userEmail, SERVICE_NAME, secret);

  // Generate high-resolution QR code as a base64 Data URL for the frontend
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#0F172A', // Slate-900 for dark squares
      light: '#FFFFFF', // White background
    },
  });

  // Encrypt secret with AES-256-GCM before database storage
  const encryptedSecret = encryptAesGcm(secret);

  return {
    secret, // Plaintext secret displayed to user for manual entry in authenticator
    qrCodeDataUrl,
    otpAuthUrl,
    encryptedSecret,
  };
};

/**
 * Verifies a 6-digit TOTP code against an encrypted secret stored in the user document.
 */
export const verifyTotpCode = (token, encryptedSecret) => {
  if (!token || !encryptedSecret) return false;

  try {
    const plainSecret = decryptAesGcm(encryptedSecret);
    return authenticator.check(token, plainSecret);
  } catch (error) {
    return false;
  }
};

// ==============================================================================
// 2. EMAIL-BASED OTP LIFECYCLE
// ==============================================================================

/**
 * Generates a 6-digit OTP, stores its SHA-256 hash on the user document,
 * and delivers the code via email.
 */
export const sendEmailOtp = async (user) => {
  const otp = generateNumericOtp(6);
  const otpHash = hashToken(otp);
  const expiresAt = new Date(
    Date.now() + SECURITY_CONFIG.EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000
  );

  user.emailOtpHash = otpHash;
  user.emailOtpExpires = expiresAt;
  await user.save();

  // Dispatch formatted HTML email
  await sendOtpEmail(user.email, user.name, otp);

  return { expiresAt };
};

/**
 * Validates an email OTP submitted by the user.
 */
export const verifyEmailOtp = async (user, submittedOtp) => {
  if (!user.emailOtpHash || !user.emailOtpExpires) {
    return false;
  }

  // Check expiration
  if (user.emailOtpExpires < new Date()) {
    return false;
  }

  // Compare hashes
  const incomingHash = hashToken(submittedOtp);
  if (incomingHash !== user.emailOtpHash) {
    return false;
  }

  // Invalidate OTP after single use
  user.emailOtpHash = undefined;
  user.emailOtpExpires = undefined;
  await user.save();

  return true;
};

// ==============================================================================
// 3. BACKUP CODES LIFECYCLE
// ==============================================================================

/**
 * Generates and associates 8 fresh backup codes with the user account.
 * Plaintext codes are returned once to be shown/downloaded by the user.
 */
export const setupBackupCodes = async (user, shouldEmail = false) => {
  const { plainCodes, hashedCodes } = generateBackupCodes(8);

  user.twoFactorBackupCodes = hashedCodes;
  await user.save();

  if (shouldEmail) {
    await sendBackupCodesEmail(user.email, user.name, plainCodes);
  }

  return plainCodes;
};

/**
 * Validates and burns a single-use backup recovery code.
 */
export const verifyAndBurnBackupCode = async (user, candidateCode) => {
  if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
    return false;
  }

  const normalizedCode = candidateCode.trim().toUpperCase();
  const incomingHash = hashToken(normalizedCode);

  // Search for an unused matching backup code
  const codeEntry = user.twoFactorBackupCodes.find(
    (item) => item.codeHash === incomingHash && !item.used
  );

  if (!codeEntry) {
    return false;
  }

  // Burn the code (single use only)
  codeEntry.used = true;
  codeEntry.usedAt = new Date();
  await user.save();

  return true;
};
