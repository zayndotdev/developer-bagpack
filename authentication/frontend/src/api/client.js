/**
 * ==============================================================================
 * 📍 FILE: src/api/client.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * API Client Layer -> Axios Instance, Memory Token Store & Silent Refresh Queue
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/api/authService.js`
 *   - `src/api/twoFactorService.js`
 *   - `src/api/userService.js`
 *   - `src/api/roleService.js`
 *   - `src/context/AuthContext.jsx` (Injects access token into memory store)
 *
 * 💡 WHY THIS EXISTS:
 * 1. Memory Token Storage: Storing JWT Access Tokens in memory (not localStorage)
 *    immunizes the client against persistent XSS token theft.
 * 2. Automatic Silent Refresh: When a protected request receives a 401 Unauthorized,
 *    this client pauses, calls the refresh endpoint (using the HTTP-only cookie),
 *    and retries the failed request seamlessly.
 * 3. Concurrency Mutex & Queue: If multiple requests fail with 401 simultaneously,
 *    only ONE refresh request is dispatched; all others wait in a queue and retry
 *    together once the new token is acquired.
 * ==============================================================================
 */

import axios from 'axios';
import { API_ENDPOINTS } from '../constants';

// In-memory access token storage (never exposed to localStorage/sessionStorage)
let memoryAccessToken = null;

export const setAccessToken = (token) => {
  memoryAccessToken = token;
};

export const getAccessToken = () => {
  return memoryAccessToken;
};

// Create configured Axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1',
  withCredentials: true, // Required for sending & receiving HTTP-only refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mutex & Queue variables for concurrent token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ------------------------------------------------------------------------------
// REQUEST INTERCEPTOR: Inject Bearer Token from Memory
// ------------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------------------------------------------------------------------
// RESPONSE INTERCEPTOR: Handle 401 via Silent Refresh with Concurrency Queue
// ------------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh retry if the request was already retried or was to login/refresh itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes(API_ENDPOINTS.REFRESH) &&
      !originalRequest.url.includes(API_ENDPOINTS.LOGIN)
    ) {
      if (isRefreshing) {
        // If another request is currently refreshing the token, enqueue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint with HTTP-only cookie
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}${API_ENDPOINTS.REFRESH}`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.data?.accessToken;
        setAccessToken(newAccessToken);

        // Resume all queued requests
        processQueue(null, newAccessToken);

        // Retry original request with newly issued token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g. cookie expired or token reuse detected), reject queue
        processQueue(refreshError, null);
        setAccessToken(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
