/**
 * ==============================================================================
 * 📍 FILE: src/constants/index.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Frontend Constants -> Centralized Routing, API Endpoints & RBAC Keys
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/App.jsx` (Configures React Router routes)
 *   - `src/api/*.js` (Builds API request URLs)
 *   - `src/context/AuthContext.jsx` (Validates user roles & login paths)
 *   - `src/components/layout/*.js` (Navigation links)
 *   - `src/pages/` (Form redirections and action paths)
 *
 * 💡 WHY THIS EXISTS:
 * Eliminates magic strings across the frontend. If a route path or backend
 * endpoint ever changes, updating this single file propagates everywhere seamlessly.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. CLIENT-SIDE ROUTE PATHS (React Router)
// ------------------------------------------------------------------------------
export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  TWO_FACTOR_CHALLENGE: '/login/2fa',

  // Protected Routes
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  SETTINGS_2FA: '/settings/2fa/setup',
  SETTINGS_PASSWORD: '/settings/password',
  ADMIN_ROLES: '/admin/roles',

  // Error & Status Pages
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
});

// ------------------------------------------------------------------------------
// 2. BACKEND API ENDPOINTS
// ------------------------------------------------------------------------------
export const API_ENDPOINTS = Object.freeze({
  // Authentication
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: (token) => `/auth/reset-password/${token}`,
  CHANGE_PASSWORD: '/auth/change-password',
  ME: '/auth/me',

  // Two-Factor Authentication
  SETUP_TOTP: '/auth/2fa/setup-totp',
  ENABLE_TOTP: '/auth/2fa/enable-totp',
  SEND_EMAIL_OTP: '/auth/2fa/send-email-otp',
  ENABLE_EMAIL_2FA: '/auth/2fa/enable-email',
  DISABLE_2FA: '/auth/2fa/disable',
  VERIFY_2FA_CHALLENGE: '/auth/2fa/verify-challenge',
  BACKUP_CODES: '/auth/2fa/backup-codes',

  // Users & RBAC Management
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  ROLES: '/roles',
  ROLE_PERMISSIONS: (name) => `/roles/${name}/permissions`,
  ASSIGN_ROLE: '/roles/assign',
});

// ------------------------------------------------------------------------------
// 3. ROLE NAMES
// ------------------------------------------------------------------------------
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
});

// ------------------------------------------------------------------------------
// 4. GRANULAR PERMISSION KEYS
// ------------------------------------------------------------------------------
export const PERMISSIONS = Object.freeze({
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  ROLES_MANAGE: 'roles:manage',
  ANALYTICS_VIEW: 'analytics:view',
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  CONTENT_DELETE: 'content:delete',
});

// ------------------------------------------------------------------------------
// 5. TWO-FACTOR METHODS
// ------------------------------------------------------------------------------
export const TWO_FACTOR_METHODS = Object.freeze({
  TOTP: 'totp',
  EMAIL: 'email',
  BACKUP: 'backup',
});
