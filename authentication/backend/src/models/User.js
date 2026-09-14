/**
 * ==============================================================================
 * 📍 FILE: src/models/User.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Data Layer (Mongoose Model) -> User Account & Security Credentials
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/controllers/authController.js` (Creates users, checks credentials)
 *   - `src/controllers/passwordController.js` (Manages reset tokens & password updates)
 *   - `src/controllers/twoFactorController.js` (Manages 2FA secrets, backup codes, OTPs)
 *   - `src/controllers/userController.js` (Retrieves user profile data)
 *   - `src/controllers/roleController.js` (Assigns custom roles to users)
 *   - `src/middleware/authMiddleware.js` (Fetches authenticated user into req.user)
 *
 * 💡 WHY THIS EXISTS:
 * Encapsulates the entire user profile, authentication state, credential hashing,
 * brute-force lockout timers, and two-factor authentication configuration.
 *
 * 🛡️ SECURITY HIGHLIGHTS:
 * 1. Passwords are automatically hashed with bcrypt (12 rounds) on save/change.
 * 2. Verification and reset tokens are NEVER stored in plaintext (hashed with SHA-256).
 * 3. 2FA TOTP secrets are encrypted via AES-256-GCM before database insertion.
 * 4. Failed login attempts automatically trigger a 15-minute account lockout after 5 tries.
 * ==============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, SECURITY_CONFIG, TWO_FACTOR_METHODS } from '../config/constants.js';

const backupCodeSchema = new mongoose.Schema(
  {
    codeHash: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Basic Profile Info
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Prevents accidental exposure in standard query results
    },

    // Role-Based Access Control (RBAC)
    role: {
      type: String,
      default: ROLES.USER,
      trim: true,
    },
    // Optional custom granular permissions overriding or supplementing role defaults
    customPermissions: {
      type: [String],
      default: [],
    },

    // Email Verification Status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Password Reset
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Two-Factor Authentication (2FA) Configuration
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorMethod: {
      type: String,
      enum: [TWO_FACTOR_METHODS.TOTP, TWO_FACTOR_METHODS.EMAIL, null],
      default: null,
    },
    // AES-256-GCM encrypted Base32 TOTP secret string (iv:authTag:encrypted)
    twoFactorSecret: {
      type: String,
      select: false,
    },
    // Array of hashed one-time backup recovery codes
    twoFactorBackupCodes: {
      type: [backupCodeSchema],
      select: false,
      default: [],
    },
    // Email-based 6-digit OTP code hash and expiration
    emailOtpHash: {
      type: String,
      select: false,
    },
    emailOtpExpires: {
      type: Date,
      select: false,
    },

    // Brute-force Login Protection
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ------------------------------------------------------------------------------
// MONGOOSE HOOKS & MIDDLEWARE
// ------------------------------------------------------------------------------

/**
 * Pre-save Hook: Automatically hashes passwords before persisting to database.
 * Only triggers if the password field was modified or is new.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(SECURITY_CONFIG.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------------------------
// INSTANCE METHODS
// ------------------------------------------------------------------------------

/**
 * Compares an unhashed candidate password against the stored bcrypt hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Checks whether the user account is currently locked due to too many failed attempts.
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increments failed login count and locks account if threshold exceeded.
 */
userSchema.methods.incrementLoginAttempts = async function () {
  // If a previous lock has expired, reset attempts counter to 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Lock account if attempts reach maximum allowed threshold
  if (this.failedLoginAttempts + 1 >= SECURITY_CONFIG.MAX_FAILED_LOGIN_ATTEMPTS) {
    updates.$set = {
      lockUntil: new Date(
        Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000
      ),
    };
  }

  return this.updateOne(updates);
};

/**
 * Resets failed attempts and unlocks account upon successful authentication.
 */
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Strips sensitive internal hashes when serializing user objects to JSON for API output.
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.twoFactorBackupCodes;
  delete obj.emailVerificationTokenHash;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpires;
  delete obj.emailOtpHash;
  delete obj.emailOtpExpires;
  delete obj.lockUntil;
  delete obj.failedLoginAttempts;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);
