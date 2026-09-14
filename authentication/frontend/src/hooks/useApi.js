/**
 * ==============================================================================
 * 📍 FILE: src/hooks/useApi.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Custom Hooks Layer -> Generic Async API State Wrapper
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/pages/`
 *
 * 💡 WHY THIS EXISTS:
 * Standardizes async API invocation, managing `loading`, `error`, and `data` states
 * and extracting uniform error messages from backend `ApiResponse` payloads.
 * ==============================================================================
 */

import { useState, useCallback } from 'react';

export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result.data || result);
        return { success: true, data: result.data || result, raw: result };
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'An unexpected network error occurred.';
        const fieldErrors = err.response?.data?.errors || null;

        setError(errorMessage);
        return { success: false, error: errorMessage, fieldErrors };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return { data, error, loading, execute, reset, setError };
};
