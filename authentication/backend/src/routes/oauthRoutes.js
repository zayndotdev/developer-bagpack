/**
 * ==============================================================================
 * 📍 FILE: src/routes/oauthRoutes.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Routing Layer -> Social Authentication (Google & GitHub OAuth 2.0)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `server.js` (under prefix `/api/v1/auth/oauth`)
 * - Delegates to: `src/controllers/oauthController.js`
 * ==============================================================================
 */

import { Router } from 'express';
import {
  getProviders,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
} from '../controllers/oauthController.js';

const router = Router();

// GET /api/v1/auth/oauth/providers - Check status of OAuth integrations
router.get('/providers', getProviders);

// Google OAuth 2.0
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// GitHub OAuth 2.0
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

export default router;
