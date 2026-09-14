/**
 * ==============================================================================
 * 📍 FILE: src/api/authService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> Authentication API Service
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/context/AuthContext.jsx` (Login, Logout, Initial Silent Refresh, getMe)
 *   - `src/pages/auth/*.jsx` (Signup, Verification, Password Reset)
 *   - `src/pages/settings/ChangePasswordPage.jsx`
 * - Interacts with:
 *   - `src/api/client.js`
 *   - `src/constants/index.js`
 *
 * 💡 WHY THIS EXISTS:
 * Shields UI components from raw Axios calls and URL strings, providing clean,
 * typed-like async methods for all authentication flows.
 * ==============================================================================
 */

import { apiClient } from './client.js';
import { API_ENDPOINTS } from '../constants';

export const authService = {
  // Sign up
  signup: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.SIGNUP, payload);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
    return response.data;
  },

  // Refresh token session
  refresh: async () => {
    const response = await apiClient.post(API_ENDPOINTS.REFRESH);
    return response.data;
  },

  // Verify email address
  verifyEmail: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.VERIFY_EMAIL, payload);
    return response.data;
  },

  // Resend email verification
  resendVerification: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.RESEND_VERIFICATION, payload);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, payload);
    return response.data;
  },

  // Reset password
  resetPassword: async (token, payload) => {
    const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD(token), payload);
    return response.data;
  },

  // Change password (authenticated)
  changePassword: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.CHANGE_PASSWORD, payload);
    return response.data;
  },

  // Fetch current user
  getMe: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ME);
    return response.data;
  },
};
