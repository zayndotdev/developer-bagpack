/**
 * ==============================================================================
 * 📍 FILE: src/components/layout/AuthLayout.jsx
 * 🎒 PART OF: Developer Backpack - Layout Components
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Layout Layer -> Centered Authentication Page Wrapper
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Wraps:
 *   - `src/pages/auth/LoginPage.jsx`
 *   - `src/pages/auth/SignUpPage.jsx`
 *   - `src/pages/auth/VerifyEmailPage.jsx`
 *   - `src/pages/auth/ForgotPasswordPage.jsx`
 *   - `src/pages/auth/ResetPasswordPage.jsx`
 *   - `src/pages/auth/TwoFactorChallengePage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Implements the Step 0 design decision: Soft atmospheric gradient glow,
 * clean responsive centering, high-contrast security badge, and consistent branding.
 * ==============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { ROUTES } from '../../constants';

export const AuthLayout = ({ children, maxWidth = 'max-w-md' }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Ambient Gradients */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-brand-100/60 via-indigo-50/40 to-transparent blur-3xl -z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 right-0 w-[450px] h-[450px] bg-gradient-to-t from-brand-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Developer Backpack
          </span>
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Production-Grade Authentication
        </p>
      </div>

      {/* Form Content Container */}
      <div className={`sm:mx-auto sm:w-full ${maxWidth} px-4 sm:px-0`}>
        {children}
      </div>

      {/* Subtle Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} Developer Backpack by{' '}
          <span className="font-semibold text-slate-600">zayndotdev</span>. MIT License.
        </p>
      </footer>
    </div>
  );
};
