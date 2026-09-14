/**
 * ==============================================================================
 * 📍 FILE: src/controllers/roleController.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Controller Layer -> Dynamic Role-Based Access Control (RBAC) Management
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `src/routes/roleRoutes.js`
 * - Interacts with:
 *   - `src/models/Role.js`
 *   - `src/models/User.js`
 *   - `src/config/constants.js` (Reads available PERMISSIONS)
 *   - `src/utils/apiResponse.js`
 *
 * 💡 WHY THIS EXISTS:
 * Fulfills the advanced RBAC requirement: Allows administrators to create custom
 * roles dynamically at runtime, assign arbitrary combinations of granular permissions,
 * and assign users to either system roles (`admin`, `moderator`, `user`) or custom roles.
 * ==============================================================================
 */

import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { PERMISSIONS } from '../config/constants.js';

/**
 * List all roles in the system and the dictionary of all available permissions
 * Route: GET /api/v1/roles
 */
export const listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ isSystemRole: -1, name: 1 });

    return ApiResponse.success(res, 'Roles retrieved successfully.', {
      roles,
      availablePermissions: Object.values(PERMISSIONS),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new dynamic custom role
 * Route: POST /api/v1/roles
 */
export const createCustomRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return ApiResponse.error(res, 'Role name is required.', 400);
    }

    const normalizedName = name.trim().toLowerCase();

    // Check if role name already exists
    const existing = await Role.findOne({ name: normalizedName });
    if (existing) {
      return ApiResponse.error(
        res,
        `A role with the name '${normalizedName}' already exists.`,
        409
      );
    }

    // Validate that provided permissions exist in system
    const validPermissions = Object.values(PERMISSIONS);
    const assignedPermissions = Array.isArray(permissions) ? permissions : [];
    const invalidPermissions = assignedPermissions.filter(
      (p) => !validPermissions.includes(p)
    );

    if (invalidPermissions.length > 0) {
      return ApiResponse.error(
        res,
        `Invalid permissions provided: [${invalidPermissions.join(', ')}]`,
        400
      );
    }

    const newRole = await Role.create({
      name: normalizedName,
      description: description || '',
      permissions: assignedPermissions,
      isSystemRole: false,
    });

    return ApiResponse.created(res, 'Custom role created successfully.', {
      role: newRole,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update permissions assigned to a custom role
 * Route: PUT /api/v1/roles/:name/permissions
 */
export const updateRolePermissions = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { permissions } = req.body;

    const role = await Role.findOne({ name: name.toLowerCase() });
    if (!role) {
      return ApiResponse.notFound(res, `Role '${name}' not found.`);
    }

    // Validate permissions
    const validPermissions = Object.values(PERMISSIONS);
    const assignedPermissions = Array.isArray(permissions) ? permissions : [];
    const invalidPermissions = assignedPermissions.filter(
      (p) => !validPermissions.includes(p)
    );

    if (invalidPermissions.length > 0) {
      return ApiResponse.error(
        res,
        `Invalid permissions provided: [${invalidPermissions.join(', ')}]`,
        400
      );
    }

    role.permissions = assignedPermissions;
    await role.save();

    return ApiResponse.success(
      res,
      `Permissions updated successfully for role '${role.name}'.`,
      { role }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a role to a specific user
 * Route: POST /api/v1/roles/assign
 */
export const assignRoleToUser = async (req, res, next) => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      return ApiResponse.error(res, 'Both userId and roleName are required.', 400);
    }

    // Verify role exists
    const role = await Role.findOne({ name: roleName.toLowerCase() });
    if (!role) {
      return ApiResponse.error(
        res,
        `Role '${roleName}' does not exist in the system.`,
        404
      );
    }

    // Update user role
    const user = await User.findById(userId);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    user.role = role.name;
    await user.save();

    return ApiResponse.success(
      res,
      `Role '${role.name}' assigned to user ${user.email} successfully.`,
      {
        user: user.toSafeObject(),
      }
    );
  } catch (error) {
    next(error);
  }
};
