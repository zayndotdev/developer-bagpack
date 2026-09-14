/**
 * ==============================================================================
 * 📍 FILE: src/services/emailService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> Email Rendering & Dispatcher
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/controllers/authController.js` (Sends email verification link & resends)
 *   - `src/controllers/passwordController.js` (Sends password reset link)
 *   - `src/services/twoFactorService.js` (Sends 2FA Email OTP and backup codes)
 * - Interacts with:
 *   - `src/config/mailer.js` (Gets initialized Nodemailer transporter)
 *   - `src/config/env.js` (Client URL, SMTP from header)
 *   - `src/templates/*.js` (HTML email template builders)
 *   - `src/utils/logger.js` (Logs outgoing emails and Ethereal preview URLs)
 *
 * 💡 WHY THIS EXISTS:
 * Encapsulates all transactional email logic behind clean, asynchronous function calls.
 * Ensures consistent sender headers, error handling, and terminal preview URLs.
 * ==============================================================================
 */

import nodemailer from 'nodemailer';
import { getTransporter } from '../config/mailer.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getVerifyEmailHtml } from '../templates/verifyEmail.js';
import { getResetPasswordHtml } from '../templates/resetPassword.js';
import { getOtpCodeHtml } from '../templates/otpCode.js';
import { getBackupCodesHtml } from '../templates/backupCodes.js';

/**
 * Generic internal sender function
 */
const sendMailInternal = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: env.SMTP.FROM,
      to,
      subject,
      html,
    });

    logger.success(`Email dispatched to ${to} | Subject: "${subject}"`);

    // If using Ethereal test account in development, print clickable preview URL in terminal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n📬 -------------------------------------------------------------`);
      console.log(`📩 [ETHEREAL TEST EMAIL PREVIEW]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`🔗 Click/View email: ${previewUrl}`);
      console.log(`-------------------------------------------------------------\n`);
    }

    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    // Don't crash the server if an email provider is down or unconfigured in dev
    return null;
  }
};

/**
 * Sends account verification email with a signed/hashed activation link.
 */
export const sendVerificationEmail = async (email, name, rawVerificationToken) => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${rawVerificationToken}&email=${encodeURIComponent(email)}`;
  const html = getVerifyEmailHtml({ name, verifyUrl });

  return sendMailInternal({
    to: email,
    subject: '🎒 Verify your Developer Backpack account',
    html,
  });
};

/**
 * Sends password reset link email.
 */
export const sendPasswordResetEmail = async (email, name, rawResetToken) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password/${rawResetToken}`;
  const html = getResetPasswordHtml({ name, resetUrl });

  return sendMailInternal({
    to: email,
    subject: '🔐 Reset your Developer Backpack password',
    html,
  });
};

/**
 * Sends 6-digit Two-Factor Authentication OTP code email.
 */
export const sendOtpEmail = async (email, name, otp) => {
  const html = getOtpCodeHtml({ name, otp });

  return sendMailInternal({
    to: email,
    subject: `🔐 Your Security Code: ${otp}`,
    html,
  });
};

/**
 * Sends emergency backup recovery codes email.
 */
export const sendBackupCodesEmail = async (email, name, codes) => {
  const html = getBackupCodesHtml({ name, codes });

  return sendMailInternal({
    to: email,
    subject: '🛡️ Your 2FA Backup Recovery Codes - Developer Backpack',
    html,
  });
};
