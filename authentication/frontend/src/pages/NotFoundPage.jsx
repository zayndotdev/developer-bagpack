/**
 * ==============================================================================
 * 📍 FILE: src/pages/NotFoundPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> 404 Not Found Screen
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `*` (Configured in `src/constants/index.js`)
 * ==============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { ROUTES } from '../constants';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-card animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <HelpCircle className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-slate-800">Page Not Found</h2>
          <p className="text-sm text-slate-500">
            The page you requested could not be found or may have moved.
          </p>
        </div>

        <div className="pt-2">
          <Link to={ROUTES.HOME}>
            <Button
              variant="primary"
              fullWidth
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
