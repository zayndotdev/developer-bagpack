/**
 * ==============================================================================
 * 📍 FILE: src/utils/logger.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Utility Layer -> Formatted Console Logger
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `server.js` (Logs server start, shutdown, uncaught exceptions)
 *   - `src/config/db.js` (Logs database connection state)
 *   - `src/config/mailer.js` (Logs email preview URLs & SMTP status)
 *   - `src/middleware/errorMiddleware.js` (Logs unhandled errors)
 *   - `src/services/emailService.js` (Logs email dispatches)
 *
 * 💡 WHY THIS EXISTS:
 * Provides clean, consistent, timestamped, colored terminal output with severity
 * levels (INFO, WARN, ERROR, DEBUG, SUCCESS) without relying on heavy external
 * logging libraries, keeping the backpack lightweight yet informative.
 * ==============================================================================
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = '') => {
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.cyan}ℹ [INFO]${colors.reset} ${message}`,
      meta ? meta : ''
    );
  },

  success: (message, meta = '') => {
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.green}✔ [SUCCESS]${colors.reset} ${message}`,
      meta ? meta : ''
    );
  },

  warn: (message, meta = '') => {
    console.warn(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.yellow}⚠ [WARN]${colors.reset} ${message}`,
      meta ? meta : ''
    );
  },

  error: (message, error = '') => {
    console.error(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.red}✖ [ERROR]${colors.reset} ${message}`,
      error ? error : ''
    );
  },

  security: (message, meta = '') => {
    console.warn(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.magenta}🛡 [SECURITY EVENT]${colors.reset} ${message}`,
      meta ? meta : ''
    );
  },
};
