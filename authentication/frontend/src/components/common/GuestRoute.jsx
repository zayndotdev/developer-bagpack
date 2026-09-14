/**
 * ==============================================================================
 * 📍 FILE: src/components/common/GuestRoute.jsx
 * 🎒 PART OF: Developer Backpack - Route Guards
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Route Guard Layer -> Unauthenticated / Guest Enforcer
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted in: `src/App.jsx` (Guards `/login`, `/signup`, `/forgot-password`)
 * - Depends on: `src/hooks/useAuth.js`
 *
 * 💡 WHY THIS EXISTS:
 * Prevents logged-in users from seeing the login or registration forms;
 * if already authenticated, redirects them directly to the Dashboard.
 * ==============================================================================
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants';
import { Spinner } from '../ui/Spinner.jsx';

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
};
