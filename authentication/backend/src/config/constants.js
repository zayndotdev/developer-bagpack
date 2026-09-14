/**
 * ==============================================================================
 * 📍 FILE: src/config/constants.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Configuration Layer -> System-wide Constants & RBAC Definitions
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/models/User.js` (Validates user roles against ROLES enum)
 *   - `src/models/Role.js` (Seeds & checks default roles and permissions)
 *   - `src/middleware/rbacMiddleware.js` (Checks user roles and permissions)
 *   - `src/services/tokenService.js` (Uses cookie config options)
 *   - `src/controllers/authController.js` (Uses cookie names and expirations)
 *
 * 💡 WHY THIS EXISTS:
 * Centralizing strings, role definitions, and permission names prevents typos
 * across the codebase, simplifies refactoring, and ensures consistent authorization
 * logic across all controllers and middlewares.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// PREDEFINED SYSTEM ROLES
// ------------------------------------------------------------------------------
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
});

// ------------------------------------------------------------------------------
// SYSTEM PERMISSIONS (Granular Actions)
// ------------------------------------------------------------------------------
// Using a resource:action convention (e.g. 'users:read') provides clear semantics
// for access control matrices and scales cleanly as new resources are added.
export const PERMISSIONS = Object.freeze({
  // User Management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  // Role & Permission Management (Custom RBAC)
  ROLES_MANAGE: 'roles:manage',

  // Analytics & Logs
  ANALYTICS_VIEW: 'analytics:view',

  // Content Operations
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  CONTENT_DELETE: 'content:delete',
});

// ------------------------------------------------------------------------------
// DEFAULT ROLE-TO-PERMISSION MAPPINGS
// ------------------------------------------------------------------------------
// When a user signs up with a predefined role, these are the baseline permissions.
// Custom roles created dynamically will define their own permission sets.
export const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.CONTENT_DELETE,
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  [ROLES.USER]: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
  ],
});

// ------------------------------------------------------------------------------
// TWO-FACTOR AUTHENTICATION METHODS
// ------------------------------------------------------------------------------
export const TWO_FACTOR_METHODS = Object.freeze({
  TOTP: 'totp',     // Google Authenticator / Authy (Time-based One-Time Password)
  EMAIL: 'email',   // 6-digit OTP delivered via email
});

// ------------------------------------------------------------------------------
// COOKIE CONFIGURATION CONSTANTS
// ------------------------------------------------------------------------------
export const COOKIE_NAMES = Object.freeze({
  REFRESH_TOKEN: 'backpack_refresh_token',
});

// ------------------------------------------------------------------------------
// SECURITY & RATE LIMITING DEFAULTS
// ------------------------------------------------------------------------------
export const SECURITY_CONFIG = Object.freeze({
  BCRYPT_SALT_ROUNDS: 12,        // 12 rounds balances high hashing resistance and CPU performance
  MAX_FAILED_LOGIN_ATTEMPTS: 5,  // Locks account after 5 consecutive failed attempts
  LOCKOUT_DURATION_MINUTES: 15,  // Brute-force lockout window
  EMAIL_OTP_EXPIRY_MINUTES: 10,  // Email OTP codes expire after 10 minutes
  EMAIL_TOKEN_EXPIRY_HOURS: 24,  // Verification link expires in 24 hours
  PASSWORD_RESET_EXPIRY_HOURS: 1,// Password reset link expires in 1 hour
});
