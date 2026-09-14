/**
 * ==============================================================================
 * 📍 FILE: src/models/Role.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Data Layer (Mongoose Model) -> Dynamic Roles & Permission Sets (RBAC)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/config/db.js` (Seeds predefined system roles on startup)
 *   - `src/controllers/roleController.js` (CRUD for custom roles & permission assignment)
 *   - `src/middleware/rbacMiddleware.js` (Resolves dynamic permissions for a user's role)
 *
 * 💡 WHY THIS EXISTS:
 * Predefined roles (admin, moderator, user) are often not enough for growing SaaS apps.
 * This model allows dynamic creation of custom roles with custom permission matrices
 * at runtime without having to modify code or deploy migrations.
 * ==============================================================================
 */

import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    permissions: {
      type: [String],
      default: [],
    },
    // Flags protected built-in roles (admin, moderator, user) so they cannot be deleted
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Role = mongoose.model('Role', roleSchema);
