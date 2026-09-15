/**
 * ==============================================================================
 * 📍 FILE: server.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Entry Point -> Express HTTP Server, Middleware Pipeline & Database Lifecycle
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Bootstraps:
 *   - `src/config/env.js` (Environment variable loader and validator)
 *   - `src/config/db.js` (MongoDB connection & dynamic in-memory fallback)
 *   - `src/routes/authRoutes.js` (/api/v1/auth)
 *   - `src/routes/twoFactorRoutes.js` (/api/v1/auth/2fa)
 *   - `src/routes/userRoutes.js` (/api/v1/users)
 *   - `src/routes/roleRoutes.js` (/api/v1/roles)
 *   - `src/middleware/errorMiddleware.js` (Central error boundary & 404 handler)
 *
 * 💡 WHY THIS EXISTS:
 * Serves as the central orchestrator of the backend application:
 * 1. Configures enterprise HTTP security headers via Helmet.
 * 2. Enforces Cross-Origin Resource Sharing (CORS) with cookie credential forwarding.
 * 3. Mounts all versioned API route trees.
 * 4. Ensures resilient database connection before opening the TCP port.
 * 5. Handles graceful shutdown on SIGINT / SIGTERM signals.
 * ==============================================================================
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { logger } from './src/utils/logger.js';
import authRoutes from './src/routes/authRoutes.js';
import twoFactorRoutes from './src/routes/twoFactorRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import roleRoutes from './src/routes/roleRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import oauthRoutes from './src/routes/oauthRoutes.js';
import {
  notFoundHandler,
  errorHandler,
} from './src/middleware/errorMiddleware.js';

const app = express();

// ------------------------------------------------------------------------------
// 1. SECURITY & HTTP MIDDLEWARES
// ------------------------------------------------------------------------------

// Helmet: Protects HTTP headers against well-known web vulnerabilities
app.use(
  helmet({
    contentSecurityPolicy: env.IS_PROD ? undefined : false,
  })
);

// CORS: Configured for credentials (HTTP-only cookies) and frontend origin
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Crucial: Allows sending and receiving refresh cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers: JSON and URL-encoded request bodies
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent memory exhaustion attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie Parser: Parses incoming Cookie headers (required for req.cookies.backpack_refresh_token)
app.use(cookieParser());

// Development request logger
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`[${req.method}] ${req.originalUrl}`);
    next();
  });
}

// ------------------------------------------------------------------------------
// 2. API ROUTE MOUNTING (Version 1)
// ------------------------------------------------------------------------------

// Health check endpoint (for load balancers and container monitors)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'Developer Backpack - Auth Service',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes (Signup, Login, Refresh, Logout, Password Recovery)
app.use('/api/v1/auth', authRoutes);

// Two-Factor Authentication routes (TOTP, Email OTP, Backup Codes, Challenges)
app.use('/api/v1/auth/2fa', twoFactorRoutes);

// User Profile and Admin User Management routes
app.use('/api/v1/users', userRoutes);

// Dynamic RBAC and Role Management routes
app.use('/api/v1/roles', roleRoutes);

// Active Devices & Session Management routes
app.use('/api/v1/auth/sessions', sessionRoutes);

// Social Logins OAuth 2.0 routes (Google & GitHub)
app.use('/api/v1/auth/oauth', oauthRoutes);

// ------------------------------------------------------------------------------
// 3. ERROR HANDLING BOUNDARIES
// ------------------------------------------------------------------------------

// Catch-all 404 for undefined endpoints
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// ------------------------------------------------------------------------------
// 4. SERVER BOOTSTRAP & GRACEFUL SHUTDOWN
// ------------------------------------------------------------------------------

let server;

const startServer = async () => {
  try {
    // 1. Establish database connection first
    await connectDB();

    // 2. Open HTTP listener
    server = app.listen(env.PORT, () => {
      console.log('\n=============================================================');
      console.log(`🎒 DEVELOPER BACKPACK - AUTHENTICATION SERVICE READY`);
      console.log(`🚀 Server running in [${env.NODE_ENV.toUpperCase()}] mode`);
      console.log(`🌐 API Base URL: http://localhost:${env.PORT}/api/v1`);
      console.log(`📡 Health Check: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`💻 CORS Client Allowed: ${env.CLIENT_URL}`);
      console.log('=============================================================\n');
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful termination handling
const handleShutdown = async (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { app, startServer };

// Auto-start if executed directly via node server.js
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export default app;
