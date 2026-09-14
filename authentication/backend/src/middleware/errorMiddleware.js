/**
 * ==============================================================================
 * 📍 FILE: src/middleware/errorMiddleware.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Middleware Layer -> Global Error Boundary & 404 Fallback
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted on: `server.js` (Mounted as the final middleware in Express pipeline)
 * - Interacts with:
 *   - `src/utils/apiResponse.js`
 *   - `src/utils/logger.js`
 *   - `src/config/env.js`
 *
 * 💡 WHY THIS EXISTS:
 * Catches all uncaught synchronous and asynchronous errors across all route handlers.
 * It transforms low-level Mongoose duplicate key errors (e.g. unique email collisions)
 * and CastErrors into clean, human-readable JSON responses without crashing the server.
 * ==============================================================================
 */

import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * 404 Not Found handler for undefined API routes
 */
export const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(
    res,
    `Route not found: [${req.method}] ${req.originalUrl}`
  );
};

/**
 * Global centralized error handler
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.originalUrl} - Error:`, err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // Handle Mongoose duplicate key error (code 11000, e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `An account with that ${field} already exists.`;
    errors = { [field]: `${field} is already taken.` };
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation error';
    errors = {};
    Object.values(err.errors).forEach((val) => {
      errors[val.path] = val.message;
    });
  }

  // Handle CastError (invalid MongoDB ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Handle JSON parsing errors in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  // In development, attach stack trace to assist rapid debugging
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};
