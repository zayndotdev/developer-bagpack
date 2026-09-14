/**
 * ==============================================================================
 * 📍 FILE: src/api/roleService.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Service Layer -> Dynamic Roles & RBAC API Service
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/pages/admin/RoleManagementPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Handles CRUD operations for dynamic custom roles, permission inspections, and role assignments.
 * ==============================================================================
 */

import { apiClient } from './client.js';
import { API_ENDPOINTS } from '../constants';

export const roleService = {
  listRoles: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ROLES);
    return response.data;
  },

  createCustomRole: async (roleData) => {
    const response = await apiClient.post(API_ENDPOINTS.ROLES, roleData);
    return response.data;
  },

  updateRolePermissions: async (roleName, permissions) => {
    const response = await apiClient.put(
      API_ENDPOINTS.ROLE_PERMISSIONS(roleName),
      { permissions }
    );
    return response.data;
  },

  assignRole: async (userId, roleName) => {
    const response = await apiClient.post(API_ENDPOINTS.ASSIGN_ROLE, {
      userId,
      roleName,
    });
    return response.data;
  },
};
