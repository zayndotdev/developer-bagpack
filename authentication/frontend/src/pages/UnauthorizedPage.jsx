/**
 * ==============================================================================
 * 📍 FILE: src/pages/UnauthorizedPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> 403 Forbidden / Access Denied Screen
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/unauthorized` (Configured in `src/constants/index.js`)
 * - Redirect target for: `src/components/common/RoleRoute.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Renders an informative, friendly message when an authenticated user attempts
 * to navigate to a route that requires a role or permission they do not possess.
 * ==============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { ROUTES } from '../constants';

export const UnauthorizedPage = () => {
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-card animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Access Denied
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            You do not have the required permissions or role privileges to view this page.
          </p>
          <p className="text-xs text-slate-400">
            Your current assigned role is:{' '}
            <strong className="text-slate-700 uppercase font-mono">{role || 'guest'}</strong>
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link to={ROUTES.DASHBOARD}>
            <Button
              variant="primary"
              fullWidth
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
