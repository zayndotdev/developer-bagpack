/**
 * ==============================================================================
 * 📍 FILE: src/routes/roleRoutes.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Routing Layer -> Dynamic RBAC & Permission Management Endpoints
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `server.js` (under prefix `/api/v1/roles`)
 * - Delegates to:
 *   - `src/controllers/roleController.js`
 *   - `src/middleware/authMiddleware.js`
 *   - `src/middleware/rbacMiddleware.js`
 *
 * 💡 WHY THIS EXISTS:
 * Exposes administration endpoints for querying available permissions, inspecting
 * roles, creating new custom roles at runtime, and assigning roles to users.
 * ==============================================================================
 */

import { Router } from 'express';
import {
  listRoles,
  createCustomRole,
  updateRolePermissions,
  assignRoleToUser,
} from '../controllers/roleController.js';
import { verifyAuth } from '../middleware/authMiddleware.js';
import { requirePermission, requireAnyPermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

// All role routes require active authentication
router.use(verifyAuth);

// Anyone logged in can inspect the available roles and permission directory (for UI rendering)
router.get('/', listRoles);

// Modifying roles and assigning permissions requires the 'roles:manage' permission (Admin)
router.post('/', requirePermission(PERMISSIONS.ROLES_MANAGE), createCustomRole);
router.put(
  '/:name/permissions',
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  updateRolePermissions
);
router.post(
  '/assign',
  requireAnyPermission(PERMISSIONS.ROLES_MANAGE, PERMISSIONS.USERS_WRITE),
  assignRoleToUser
);

export default router;
