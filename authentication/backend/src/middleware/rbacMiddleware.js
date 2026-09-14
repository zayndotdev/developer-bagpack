/**
 * ==============================================================================
 * 📍 FILE: src/middleware/rbacMiddleware.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Middleware Layer -> Role-Based & Permission-Based Access Control (RBAC)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on:
 *   - `src/routes/roleRoutes.js` (Restricts role creation/management to admin)
 *   - `src/routes/userRoutes.js` (Restricts user list/delete to admin/moderator)
 * - Interacts with:
 *   - `src/config/constants.js` (Reads predefined roles and default permission maps)
 *   - `src/models/Role.js` (Resolves dynamic custom role permissions from DB)
 *   - `src/utils/apiResponse.js` (Sends 403 Forbidden responses)
 *
 * 💡 WHY THIS EXISTS:
 * Role-based checks (`requireRole('admin')`) are simple for coarse access control,
 * but real-world enterprise apps require granular permission checks (`requirePermission('users:delete')`).
 * This middleware supports BOTH:
 * 1. Predefined role checking (`admin`, `moderator`, `user`).
 * 2. Dynamic permission checking that merges built-in permissions, custom dynamic
 *    role permissions from MongoDB, and individual user permission overrides.
 * ==============================================================================
 */

import { DEFAULT_ROLE_PERMISSIONS } from '../config/constants.js';
import { Role } from '../models/Role.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Helper to resolve all effective permissions for a user:
 * - Default permissions for predefined roles (admin, moderator, user)
 * - Dynamic permissions from the database for custom roles
 * - Individual custom permission overrides attached directly to the user
 */
export const getUserEffectivePermissions = async (user) => {
  const permissionsSet = new Set();

  // 1. Check predefined role mapping
  if (DEFAULT_ROLE_PERMISSIONS[user.role]) {
    DEFAULT_ROLE_PERMISSIONS[user.role].forEach((perm) => permissionsSet.add(perm));
  } else {
    // 2. Check dynamic custom role in MongoDB
    const customRoleDoc = await Role.findOne({ name: user.role });
    if (customRoleDoc && Array.isArray(customRoleDoc.permissions)) {
      customRoleDoc.permissions.forEach((perm) => permissionsSet.add(perm));
    }
  }

  // 3. Merge user-specific custom permissions
  if (Array.isArray(user.customPermissions)) {
    user.customPermissions.forEach((perm) => permissionsSet.add(perm));
  }

  return Array.from(permissionsSet);
};

/**
 * Middleware factory: Enforces that the user has one of the allowed roles.
 * Usage: router.get('/admin-only', verifyAuth, requireRole('admin'), controller);
 *        router.get('/staff', verifyAuth, requireRole('admin', 'moderator'), controller);
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required.');
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return ApiResponse.forbidden(
        res,
        `Access denied: This action requires one of the following roles: [${allowedRoles.join(
          ', '
        )}]. Your current role is '${req.user.role}'.`
      );
    }

    next();
  };
};

/**
 * Middleware factory: Enforces that the user has all specified granular permissions.
 * Usage: router.delete('/users/:id', verifyAuth, requirePermission('users:delete'), controller);
 */
export const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required.');
      }

      // Admin role bypasses granular permission checks
      if (req.user.role === 'admin') {
        return next();
      }

      const effectivePermissions = await getUserEffectivePermissions(req.user);
      const missingPermissions = requiredPermissions.filter(
        (perm) => !effectivePermissions.includes(perm)
      );

      if (missingPermissions.length > 0) {
        return ApiResponse.forbidden(
          res,
          `Access denied: Missing required permission(s): [${missingPermissions.join(
            ', '
          )}]`
        );
      }

      // Attach effective permissions to request for downstream controller reference
      req.userPermissions = effectivePermissions;
      next();
    } catch (error) {
      next(error);
    }
  };
};
