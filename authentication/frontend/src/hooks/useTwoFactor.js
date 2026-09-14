/**
 * ==============================================================================
 * 📍 FILE: src/hooks/useTwoFactor.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Custom Hooks Layer -> Two-Factor Authentication Orchestrator Hook
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/pages/settings/TwoFactorSetupPage.jsx`
 *   - `src/pages/auth/TwoFactorChallengePage.jsx`
 *   - `src/pages/settings/SettingsPage.jsx`
 * - Interacts with:
 *   - `src/api/twoFactorService.js`
 *   - `src/context/AuthContext.jsx` (refreshUser, complete2FaChallenge)
 *
 * 💡 WHY THIS EXISTS:
 * Encapsulates the multi-step 2FA enrollment wizard and challenge login states
 * into a single unified hook.
 * ==============================================================================
 */

import { useState } from 'react';
import { twoFactorService } from '../api/twoFactorService.js';
import { useAuth } from './useAuth.js';

export const useTwoFactor = () => {
  const { refreshUser, complete2FaChallenge } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setupData, setSetupData] = useState(null); // { qrCodeDataUrl, manualEntryKey }
  const [backupCodes, setBackupCodes] = useState([]);

  // Step 1: Start TOTP Setup
  const initTotpSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await twoFactorService.setupTotp();
      setSetupData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initialize 2FA setup.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Enable TOTP with 6-digit verification code
  const confirmTotp = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await twoFactorService.enableTotp(code);
      setBackupCodes(response.data?.backupCodes || []);
      await refreshUser();
      return { success: true, backupCodes: response.data?.backupCodes };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid verification code.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Request an Email OTP
  const sendEmailOtp = async (mfaTicket = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await twoFactorService.sendEmailOtp(mfaTicket);
      return { success: true, message: response.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send Email OTP.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Enable Email OTP 2FA
  const confirmEmail2fa = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await twoFactorService.enableEmail2fa(code);
      setBackupCodes(response.data?.backupCodes || []);
      await refreshUser();
      return { success: true, backupCodes: response.data?.backupCodes };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid Email OTP code.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const disable2fa = async (password) => {
    setLoading(true);
    setError(null);
    try {
      await twoFactorService.disable2fa(password);
      await refreshUser();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to disable 2FA.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Verify Login 2FA Challenge
  const verifyChallenge = async ({ mfaTicket, code, method }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await twoFactorService.verifyChallenge({
        mfaTicket,
        code,
        method,
      });
      complete2FaChallenge(response.data);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setupData,
    backupCodes,
    initTotpSetup,
    confirmTotp,
    sendEmailOtp,
    confirmEmail2fa,
    disable2fa,
    verifyChallenge,
    setError,
  };
};
