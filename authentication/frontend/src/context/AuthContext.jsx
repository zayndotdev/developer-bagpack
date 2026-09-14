/**
 * ==============================================================================
 * 📍 FILE: src/context/AuthContext.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * State Management Layer -> Central Authentication & Authorization Context
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Provided at root in: `src/App.jsx`
 * - Consumed via: `src/hooks/useAuth.js`
 * - Guards depend on this:
 *   - `src/components/common/ProtectedRoute.jsx`
 *   - `src/components/common/RoleRoute.jsx`
 *   - `src/components/common/GuestRoute.jsx`
 * - Interacts with:
 *   - `src/api/authService.js`
 *   - `src/api/client.js` (setAccessToken, getAccessToken)
 *
 * 💡 WHY THIS EXISTS:
 * Serves as the single source of truth for user identity, role, permissions,
 * in-memory access token, and authentication loading state across the entire React app.
 * Automatically recovers user sessions on page refresh via silent refresh without
 * ever storing tokens in unencrypted localStorage.
 * ==============================================================================
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/authService.js';
import { setAccessToken } from '../api/client.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Temporary state holding MFA ticket and method when a user hits a 2FA challenge
  const [mfaPendingSession, setMfaPendingSession] = useState(null);

  /**
   * Initializes or recovers the session on page refresh via silent refresh.
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      // Calls /auth/refresh with the HTTP-only cookie automatically attached
      const response = await authService.refresh();
      if (response.success && response.data) {
        const { accessToken, user: userData, permissions: userPerms } = response.data;
        setAccessToken(accessToken);
        setUser(userData);
        setPermissions(userPerms || []);
      }
    } catch (error) {
      // Not logged in or refresh cookie expired; remain as unauthenticated guest
      setAccessToken(null);
      setUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Primary Login Action
   */
  const login = async (credentials) => {
    const response = await authService.login(credentials);

    if (response.success) {
      // Case 1: Two-Factor Authentication is required
      if (response.data?.requires2FA) {
        setMfaPendingSession({
          mfaTicket: response.data.mfaTicket,
          twoFactorMethod: response.data.twoFactorMethod,
          email: credentials.email,
        });
        return { requires2FA: true };
      }

      // Case 2: Standard login successful (no 2FA)
      const { accessToken, user: userData, permissions: userPerms } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
      setPermissions(userPerms || []);
      setMfaPendingSession(null);
      return { success: true };
    }

    return response;
  };

  /**
   * Completes 2FA Login Challenge after code is verified
   */
  const complete2FaChallenge = ({ accessToken, user: userData, permissions: userPerms }) => {
    setAccessToken(accessToken);
    setUser(userData);
    setPermissions(userPerms || []);
    setMfaPendingSession(null);
  };

  /**
   * Logout Action
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setPermissions([]);
      setMfaPendingSession(null);
    }
  };

  /**
   * Refetches user profile and updated permissions (e.g. after profile edit or 2FA update)
   */
  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response.success && response.data) {
        setUser(response.data.user);
        setPermissions(response.data.permissions || []);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  /**
   * RBAC Helper: Check if current user possesses a specific role
   */
  const hasRole = (roleOrRoles) => {
    if (!user) return false;
    if (Array.isArray(roleOrRoles)) {
      return roleOrRoles.includes(user.role);
    }
    return user.role === roleOrRoles;
  };

  /**
   * RBAC Helper: Check if current user possesses a specific permission
   */
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admins possess all permissions
    return permissions.includes(permission);
  };

  const value = {
    user,
    role: user?.role || null,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    mfaPendingSession,
    setMfaPendingSession,
    login,
    logout,
    complete2FaChallenge,
    refreshUser,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
