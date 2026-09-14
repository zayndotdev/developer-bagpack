/**
 * ==============================================================================
 * 📍 FILE: src/api/userService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> User Profile & User Management API Service
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/pages/settings/SettingsPage.jsx`
 *   - `src/pages/dashboard/DashboardPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Handles user profile updates and administrative user list/delete endpoints.
 * ==============================================================================
 */

import { apiClient } from './client.js';
import { API_ENDPOINTS } from '../constants';

export const userService = {
  getProfile: async () => {
    const response = await apiClient.get(`${API_ENDPOINTS.USERS}/me`);
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put(`${API_ENDPOINTS.USERS}/me`, data);
    return response.data;
  },

  listUsers: async (page = 1, limit = 10) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.USERS}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.USER_BY_ID(id));
    return response.data;
  },
};
