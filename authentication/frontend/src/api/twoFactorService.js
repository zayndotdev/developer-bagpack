/**
 * ==============================================================================
 * 📍 FILE: src/api/twoFactorService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> Two-Factor Authentication API Service
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/hooks/useTwoFactor.js`
 *   - `src/pages/auth/TwoFactorChallengePage.jsx`
 *   - `src/pages/settings/TwoFactorSetupPage.jsx`
 *   - `src/pages/settings/SettingsPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Encapsulates 2FA network operations (TOTP QR setup, verification, email OTPs,
 * login challenges, and backup codes).
 * ==============================================================================
 */

import { apiClient } from './client.js';
import { API_ENDPOINTS } from '../constants';

export const twoFactorService = {
  // Setup Google Authenticator (TOTP)
  setupTotp: async () => {
    const response = await apiClient.post(API_ENDPOINTS.SETUP_TOTP);
    return response.data;
  },

  // Confirm code and enable TOTP
  enableTotp: async (code) => {
    const response = await apiClient.post(API_ENDPOINTS.ENABLE_TOTP, { code });
    return response.data;
  },

  // Request an Email OTP (can be called unauthenticated during login with mfaTicket)
  sendEmailOtp: async (mfaTicket = null) => {
    const response = await apiClient.post(API_ENDPOINTS.SEND_EMAIL_OTP, { mfaTicket });
    return response.data;
  },

  // Enable Email OTP 2FA
  enableEmail2fa: async (code) => {
    const response = await apiClient.post(API_ENDPOINTS.ENABLE_EMAIL_2FA, { code });
    return response.data;
  },

  // Disable 2FA (requires password)
  disable2fa: async (password) => {
    const response = await apiClient.post(API_ENDPOINTS.DISABLE_2FA, { password });
    return response.data;
  },

  // Verify challenge code during login (TOTP, Email OTP, or Backup Code)
  verifyChallenge: async ({ mfaTicket, code, method }) => {
    const response = await apiClient.post(API_ENDPOINTS.VERIFY_2FA_CHALLENGE, {
      mfaTicket,
      code,
      method,
    });
    return response.data;
  },

  // Regenerate emergency backup recovery codes
  regenerateBackupCodes: async (password) => {
    const response = await apiClient.post(API_ENDPOINTS.BACKUP_CODES, { password });
    return response.data;
  },
};
