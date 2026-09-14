/**
 * ==============================================================================
 * 📍 FILE: src/config/mailer.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Configuration Layer -> Nodemailer Transporter Factory & Ethereal Fallback
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/services/emailService.js` (Calls getTransporter() and sendMail())
 * - Interacts with:
 *   - `src/config/env.js` (Reads SMTP_HOST, PORT, USER, PASS, FROM)
 *   - `src/utils/logger.js` (Logs preview links for sent emails)
 *
 * 💡 WHY THIS EXISTS:
 * Abstracts email transport creation. If real SMTP credentials are provided,
 * it routes through that provider (Gmail, SendGrid, Mailgun, Amazon SES).
 * If no SMTP credentials are provided in development mode, it generates a
 * dynamic Ethereal test account on the fly and prints a clickable preview URL
 * into the console, enabling instant testing without having to register third-party keys.
 * ==============================================================================
 */

import nodemailer from 'nodemailer';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let transporterInstance = null;

/**
 * Initializes and caches the Nodemailer transporter.
 */
export const getTransporter = async () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  // If real SMTP host and credentials are provided in .env
  if (env.SMTP.HOST && env.SMTP.USER) {
    logger.info(`Configuring Nodemailer with external SMTP host: ${env.SMTP.HOST}`);
    transporterInstance = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT,
      secure: env.SMTP.PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP.USER,
        pass: env.SMTP.PASS,
      },
    });
    return transporterInstance;
  }

  // Fallback in development: Generate a free Ethereal test account automatically
  if (env.NODE_ENV === 'development') {
    logger.info('No custom SMTP credentials found. Creating automatic Ethereal test mailer...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      logger.success(`Ethereal test mailer created: ${testAccount.user}`);

      transporterInstance = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      return transporterInstance;
    } catch (err) {
      logger.error('Failed to create Ethereal test account:', err.message);
      // Create json transport fallback so server never crashes on email failure
      transporterInstance = nodemailer.createTransport({
        jsonTransport: true,
      });
      return transporterInstance;
    }
  }

  // Production fallback with missing credentials
  throw new Error('Critical: SMTP credentials must be configured in production!');
};
