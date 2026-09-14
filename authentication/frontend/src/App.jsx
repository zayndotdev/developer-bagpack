/**
 * ==============================================================================
 * 📍 FILE: src/App.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Root Application Component -> React Router DOM v6 Declarative Route Tree
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted in: `src/main.jsx`
 * - Wraps entire tree with: `src/context/AuthContext.jsx` (<AuthProvider>)
 * - Uses Route Guards:
 *   - `src/components/common/ProtectedRoute.jsx`
 *   - `src/components/common/RoleRoute.jsx`
 *   - `src/components/common/GuestRoute.jsx`
 * - Mounts Pages:
 *   - `src/pages/auth/*.jsx`
 *   - `src/pages/dashboard/DashboardPage.jsx`
 *   - `src/pages/settings/*.jsx`
 *   - `src/pages/admin/RoleManagementPage.jsx`
 *   - `src/pages/UnauthorizedPage.jsx`
 *   - `src/pages/NotFoundPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Defines the complete client-side routing table, enforcing guest guards,
 * authenticated guards, and RBAC role guards declaratively.
 * ==============================================================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { RoleRoute } from './components/common/RoleRoute.jsx';
import { GuestRoute } from './components/common/GuestRoute.jsx';
import { ROUTES, ROLES } from './constants';

// Authentication Pages
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { SignUpPage } from './pages/auth/SignUpPage.jsx';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { TwoFactorChallengePage } from './pages/auth/TwoFactorChallengePage.jsx';

// Protected Pages
import { DashboardPage } from './pages/dashboard/DashboardPage.jsx';
import { SettingsPage } from './pages/settings/SettingsPage.jsx';
import { TwoFactorSetupPage } from './pages/settings/TwoFactorSetupPage.jsx';
import { ChangePasswordPage } from './pages/settings/ChangePasswordPage.jsx';
import { RoleManagementPage } from './pages/admin/RoleManagementPage.jsx';

// Status Pages
import { UnauthorizedPage } from './pages/UnauthorizedPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Root Redirect: To Dashboard if authenticated, else to Login */}
        <Route
          path={ROUTES.HOME}
          element={<Navigate to={ROUTES.DASHBOARD} replace />}
        />

        {/* Public & Guest Routes (Redirects to Dashboard if already signed in) */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.SIGNUP}
          element={
            <GuestRoute>
              <SignUpPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />

        {/* Email Verification & Password Reset from Links */}
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        {/* 2FA Login Challenge (Part of multi-step login flow) */}
        <Route path={ROUTES.TWO_FACTOR_CHALLENGE} element={<TwoFactorChallengePage />} />

        {/* Protected Routes (Requires verified JWT Access Token) */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SETTINGS_2FA}
          element={
            <ProtectedRoute>
              <TwoFactorSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SETTINGS_PASSWORD}
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Route: Admin Role Management Console */}
        <Route
          path={ROUTES.ADMIN_ROLES}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <RoleManagementPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Status & Error Pages */}
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
