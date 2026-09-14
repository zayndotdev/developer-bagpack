/**
 * ==============================================================================
 * 📍 FILE: src/config/db.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Configuration Layer -> Database Connection & Seed Manager
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `server.js` (Invokes connectDB() before starting the Express listener)
 * - Interacts with:
 *   - `src/models/Role.js` (Seeds initial default roles and permissions)
 *   - `src/config/constants.js` (Reads default role definitions)
 *
 * 💡 WHY THIS EXISTS:
 * Establishes a robust Mongoose connection to MongoDB.
 * For zero-friction developer experience: If a local MongoDB daemon is not running
 * during development, it automatically starts an in-memory MongoDB server so anyone
 * who clones this backpack can run and test it immediately without prior MongoDB setup!
 * ==============================================================================
 */

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { Role } from '../models/Role.js';
import { ROLES, DEFAULT_ROLE_PERMISSIONS } from './constants.js';

let mongoMemoryInstance = null;

/**
 * Seeds default system roles (admin, moderator, user) if they do not already exist.
 */
const seedDefaultRoles = async () => {
  try {
    const existingRolesCount = await Role.countDocuments();
    if (existingRolesCount === 0) {
      logger.info('Seeding initial RBAC system roles (admin, moderator, user)...');

      const seedRoles = [
        {
          name: ROLES.ADMIN,
          description: 'Full system administrator with unrestricted access',
          permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.ADMIN],
          isSystemRole: true,
        },
        {
          name: ROLES.MODERATOR,
          description: 'Staff moderator with user read and content moderation permissions',
          permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.MODERATOR],
          isSystemRole: true,
        },
        {
          name: ROLES.USER,
          description: 'Standard registered user with basic access permissions',
          permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.USER],
          isSystemRole: true,
        },
      ];

      await Role.insertMany(seedRoles);
      logger.success('Default RBAC roles seeded successfully into database.');
    }
  } catch (error) {
    logger.error('Failed to seed default roles:', error.message);
  }
};

/**
 * Connects to MongoDB with fallback in-memory support for seamless development.
 */
export const connectDB = async () => {
  try {
    logger.info(`Attempting connection to MongoDB at: ${env.MONGODB_URI}...`);

    // Set connection timeout so fallback triggers promptly if local Mongo daemon is absent
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });

    logger.success(
      `MongoDB connected successfully: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
    await seedDefaultRoles();
  } catch (initialError) {
    // If not in production, attempt automatic fallback to in-memory database
    if (env.NODE_ENV === 'development') {
      logger.warn(
        `Direct MongoDB connection failed (${initialError.message}). Starting in-memory fallback...`
      );

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryInstance = await MongoMemoryServer.create({
          binary: {
            version: '4.4.18',
          },
        });
        const memoryUri = mongoMemoryInstance.getUri();

        logger.info(`In-memory MongoDB started at: ${memoryUri}`);
        await mongoose.connect(memoryUri);

        logger.success('Connected to In-Memory MongoDB for zero-friction local development!');
        await seedDefaultRoles();
      } catch (fallbackError) {
        logger.error(
          'Both primary and in-memory MongoDB connections failed:',
          fallbackError.message
        );
        throw fallbackError;
      }
    } else {
      logger.error('Critical: MongoDB connection failed in production:', initialError.message);
      throw initialError;
    }
  }

  // Monitor database connection events
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Reconnecting...');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime connection error:', err.message);
  });
};

/**
 * Closes the database connection gracefully during process termination.
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoMemoryInstance) {
      await mongoMemoryInstance.stop();
    }
    logger.info('MongoDB connection closed gracefully.');
  } catch (error) {
    logger.error('Error during database disconnect:', error.message);
  }
};
