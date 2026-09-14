/**
 * ==============================================================================
 * 📍 FILE: src/utils/apiResponse.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Utility Layer -> Standardized API Response Helpers
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - All controllers (`src/controllers/*.js`)
 *   - Global error handler (`src/middleware/errorMiddleware.js`)
 *   - Authentication middlewares (`src/middleware/authMiddleware.js`, `rbacMiddleware.js`)
 *
 * 💡 WHY THIS EXISTS:
 * Frontend consumers and API clients require a predictable, consistent envelope:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   errors?: any
 * }
 * Standardizing this prevents inconsistent response formats across different endpoints.
 * ==============================================================================
 */

export class ApiResponse {
  /**
   * Send a successful response (HTTP 200 OK by default)
   */
  static success(res, message = 'Operation successful', data = null, statusCode = 200) {
    const payload = {
      success: true,
      message,
    };
    if (data !== null && data !== undefined) {
      payload.data = data;
    }
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a resource created response (HTTP 201 Created)
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return ApiResponse.success(res, message, data, 201);
  }

  /**
   * Send a standard error response
   */
  static error(res, message = 'An error occurred', statusCode = 400, errors = null) {
    const payload = {
      success: false,
      message,
    };
    if (errors !== null && errors !== undefined) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  }

  /**
   * Send 401 Unauthorized response (e.g. invalid or missing token)
   */
  static unauthorized(res, message = 'Authentication required or invalid token') {
    return ApiResponse.error(res, message, 401);
  }

  /**
   * Send 403 Forbidden response (e.g. insufficient permissions or token reuse breach)
   */
  static forbidden(res, message = 'Access denied: insufficient permissions or security restriction') {
    return ApiResponse.error(res, message, 403);
  }

  /**
   * Send 404 Not Found response
   */
  static notFound(res, message = 'Requested resource was not found') {
    return ApiResponse.error(res, message, 404);
  }

  /**
   * Send 429 Too Many Requests response (Rate limit exceeded)
   */
  static tooManyRequests(res, message = 'Too many requests. Please try again later.') {
    return ApiResponse.error(res, message, 429);
  }
}
