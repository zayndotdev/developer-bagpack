/**
 * ==============================================================================
 * 📍 FILE: src/routes/sessionRoutes.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Routing Layer -> Active Devices & Session Telemetry Endpoints
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `server.js` (under prefix `/api/v1/auth/sessions`)
 * - Delegates to: `src/controllers/sessionController.js`
 * - Guarded by: `src/middleware/authMiddleware.js`
 * ==============================================================================
 */

import { Router } from 'express';
import {
  listSessions,
  revokeSession,
  revokeOtherSessions,
} from '../controllers/sessionController.js';
import { verifyAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All session routes require active user authentication
router.use(verifyAuth);

// GET /api/v1/auth/sessions - List all active device sessions
router.get('/', listSessions);

// DELETE /api/v1/auth/sessions/other - Revoke all sessions except current
router.delete('/other', revokeOtherSessions);

// DELETE /api/v1/auth/sessions/:sessionId - Revoke a specific session
router.delete('/:sessionId', revokeSession);

export default router;
