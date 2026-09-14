/**
 * ==============================================================================
 * 📍 FILE: src/controllers/userController.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Controller Layer -> User Profile & User Management Handlers
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `src/routes/userRoutes.js`
 * - Delegates to:
 *   - `src/middleware/rbacMiddleware.js` (getUserEffectivePermissions)
 * - Interacts with:
 *   - `src/models/User.js`
 *   - `src/utils/apiResponse.js`
 *
 * 💡 WHY THIS EXISTS:
 * Handles user profile updates and administrative user management (listing,
 * inspecting, and deleting user accounts) with granular RBAC enforcement.
 * ==============================================================================
 */

import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { getUserEffectivePermissions } from '../middleware/rbacMiddleware.js';

/**
 * Get current user's profile and active permissions
 * Route: GET /api/v1/users/me
 */
export const getProfile = async (req, res, next) => {
  try {
    const permissions = await getUserEffectivePermissions(req.user);

    return ApiResponse.success(res, 'Profile retrieved successfully.', {
      user: req.user.toSafeObject(),
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's basic profile information
 * Route: PUT /api/v1/users/me
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return ApiResponse.error(res, 'Name cannot be empty.', 400);
    }

    req.user.name = name.trim();
    await req.user.save();

    const permissions = await getUserEffectivePermissions(req.user);

    return ApiResponse.success(res, 'Profile updated successfully.', {
      user: req.user.toSafeObject(),
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all users with pagination (Admin / Moderator only)
 * Route: GET /api/v1/users
 */
export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -twoFactorSecret -twoFactorBackupCodes'),
      User.countDocuments(),
    ]);

    return ApiResponse.success(res, 'Users retrieved successfully.', {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user account (Admin only)
 * Route: DELETE /api/v1/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting their own account
    if (req.user._id.toString() === id) {
      return ApiResponse.error(
        res,
        'Cannot delete your own active administrator account.',
        400
      );
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    return ApiResponse.success(res, `User ${user.email} deleted successfully.`);
  } catch (error) {
    next(error);
  }
};
