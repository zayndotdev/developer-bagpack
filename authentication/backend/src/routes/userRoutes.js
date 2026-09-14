/**
 * ==============================================================================
 * 📍 FILE: src/routes/userRoutes.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Routing Layer -> User Profile & User Administration Endpoints
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `server.js` (under prefix `/api/v1/users`)
 * - Delegates to:
 *   - `src/controllers/userController.js`
 *   - `src/middleware/authMiddleware.js`
 *   - `src/middleware/rbacMiddleware.js`
 *
 * 💡 WHY THIS EXISTS:
 * Protects user profile endpoints and administrative CRUD operations with RBAC guards.
 * ==============================================================================
 */

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  listUsers,
  deleteUser,
} from '../controllers/userController.js';
import { verifyAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

// All user routes require a verified JWT Access Token
router.use(verifyAuth);

// Current user profile
router.get('/me', getProfile);
router.put('/me', updateProfile);

// Admin / Moderator User Management
router.get('/', requirePermission(PERMISSIONS.USERS_READ), listUsers);
router.delete('/:id', requirePermission(PERMISSIONS.USERS_DELETE), deleteUser);

export default router;
