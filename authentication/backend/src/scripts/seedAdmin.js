/**
 * ==============================================================================
 * 📍 FILE: src/scripts/seedAdmin.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * CLI Scripts -> Admin Account Seeder
 *
 * 💡 WHY THIS EXISTS:
 * Seeds or promotes a dedicated administrator account directly in MongoDB.
 * Ensures the admin has 'isEmailVerified: true' and full 'admin' RBAC privileges.
 * Can be run anytime via: npm run seed:admin
 *
 * Usage:
 *   npm run seed:admin
 *   npm run seed:admin -- --password=YourCustomPassword123!
 *   node src/scripts/seedAdmin.js admin@developerbackpack.dev MyPassword123!
 * ==============================================================================
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const ADMIN_EMAIL = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2].toLowerCase()
  : process.env.ADMIN_EMAIL || 'admin@developerbackpack.dev';

// Parse optional password from CLI arguments or environment
const parsePasswordArg = () => {
  const customArg = process.argv.find((arg) => arg.startsWith('--password='));
  if (customArg) return customArg.split('=')[1];
  if (process.argv[3] && !process.argv[3].startsWith('--')) return process.argv[3];
  return process.env.ADMIN_PASSWORD || 'Admin@123456!';
};

const ADMIN_PASSWORD = parsePasswordArg();

const seedAdmin = async () => {
  try {
    console.log('\n=============================================================');
    console.log('🎒 DEVELOPER BACKPACK - ADMIN ACCOUNT SEEDER');
    console.log('=============================================================');
    logger.info(`Connecting to MongoDB...`);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.success('Connected to database.');

    let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

    if (user) {
      logger.warn(`User with email [${ADMIN_EMAIL}] already exists. Promoting to admin...`);
      user.role = ROLES.ADMIN;
      user.isEmailVerified = true;
      user.failedLoginAttempts = 0;
      user.lockUntil = null;

      // Update password if explicitly requested
      if (process.argv.includes('--reset-password') || process.env.ADMIN_RESET_PASSWORD === 'true') {
        user.password = ADMIN_PASSWORD;
        logger.info('Resetting password to specified default...');
      }

      await user.save();
      logger.success(`Account [${ADMIN_EMAIL}] is now confirmed as an active ADMIN!`);
    } else {
      logger.info(`Creating new administrator account for [${ADMIN_EMAIL}]...`);

      user = new User({
        name: 'Backpack Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: ROLES.ADMIN,
        isEmailVerified: true,
      });

      await user.save();
      logger.success('New administrator account created successfully!');
    }

    console.log('\n-------------------------------------------------------------');
    console.log('🔑 ADMIN CREDENTIALS:');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔒 Password: ${ADMIN_PASSWORD}`);
    console.log(`🛡️  Role:     admin`);
    console.log('-------------------------------------------------------------\n');

    await mongoose.connection.close();
    logger.info('Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed admin account:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
