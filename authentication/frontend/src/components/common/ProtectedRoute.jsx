/**
 * ==============================================================================
 * 📍 FILE: src/components/common/ProtectedRoute.jsx
 * 🎒 PART OF: Developer Backpack - Route Guards
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Route Guard Layer -> Authentication Enforcer
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted in: `src/App.jsx`
 * - Depends on: `src/hooks/useAuth.js`
 * - Depends on: `src/components/ui/Spinner.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Intercepts routes that require active authentication. If the session is still
 * initializing via silent refresh, renders a loading spinner. If unauthenticated,
 * redirects to the login screen with state preserving the intended return destination.
 * ==============================================================================
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants';
import { Spinner } from '../ui/Spinner.jsx';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Spinner size="lg" className="text-brand-600" />
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Verifying Session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination path in router state
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};
