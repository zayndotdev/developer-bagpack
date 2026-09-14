/**
 * ==============================================================================
 * 📍 FILE: src/pages/dashboard/DashboardPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Authenticated User Dashboard & RBAC Permission Tester
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/dashboard` (Configured in `src/constants/index.js`)
 * - Wrapped by: `src/components/common/ProtectedRoute.jsx`
 * - Depends on:
 *   - `src/components/layout/DashboardLayout.jsx`
 *   - `src/hooks/useAuth.js`
 *   - `src/components/ui/*.jsx` (Card, Badge, Button, Alert)
 *
 * 💡 WHY THIS EXISTS:
 * Serves as the interactive landing hub for authenticated users:
 * 1. Displays current profile details, system role, and 2FA status.
 * 2. Visualizes the user's effective permissions matrix.
 * 3. Provides an interactive "RBAC Permission Tester" allowing developers to
 *    test what happens when an endpoint requires permissions they have vs. don't have.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES, ROLES, PERMISSIONS } from '../../constants';
import { userService } from '../../api/userService.js';

export const DashboardPage = () => {
  const { user, role, permissions, hasPermission, hasRole } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Test an action that requires 'users:read'
  const handleTestUsersRead = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await userService.listUsers(1, 5);
      setTestResult({
        success: true,
        message: `Action Allowed! Successfully fetched ${response.data?.users?.length || 0} users from backend.`,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err.response?.data?.message ||
          'Access Denied (403 Forbidden): Missing permission.',
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-brand-500/15 relative overflow-hidden">
          <div
            className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 text-brand-50">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Authentication & Authorization Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Developer'}!
            </h1>
            <p className="mt-2 text-brand-100 text-sm sm:text-base leading-relaxed">
              Your session is authenticated via memory-stored Access Tokens (JWT) and
              a secure HTTP-only rotating Refresh Token.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={ROUTES.SETTINGS}>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Manage Security & 2FA
                </Button>
              </Link>
              {hasRole(ROLES.ADMIN) && (
                <Link to={ROUTES.ADMIN_ROLES}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    Custom Roles Console
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Security & Role Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Identity & Role */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assigned Role
                </span>
                <Badge variant={role} size="md">
                  {role}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{user?.name}</h3>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Account Verified</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
          </Card>

          {/* Card 2: Two-Factor Authentication Status */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Two-Factor Security
                </span>
                {user?.twoFactorEnabled ? (
                  <Badge variant="emerald" size="sm">
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="amber" size="sm">
                    Disabled
                  </Badge>
                )}
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    user?.twoFactorEnabled
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {user?.twoFactorEnabled ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {user?.twoFactorEnabled
                      ? `Method: ${user.twoFactorMethod?.toUpperCase()}`
                      : 'Account at Risk'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user?.twoFactorEnabled
                      ? 'Protected by multi-step authentication challenges.'
                      : 'Enable Google Authenticator or Email OTP in Settings.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                to={ROUTES.SETTINGS_2FA}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 hover:underline"
              >
                {user?.twoFactorEnabled ? 'Reconfigure 2FA' : 'Enable 2FA Now'} &rarr;
              </Link>
            </div>
          </Card>

          {/* Card 3: Token Architecture Details */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Token Strategy
                </span>
                <span className="text-[11px] font-mono text-slate-400">JWT + Cookie</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Access Token:</span>
                  <span className="font-semibold text-slate-800">Memory (15 mins)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Refresh Token:</span>
                  <span className="font-semibold text-slate-800">HTTP-only (7 days)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Rotation & Theft:</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Tokens rotate automatically on expiration via Axios queue.
            </div>
          </Card>
        </div>

        {/* Effective Permissions Matrix */}
        <Card
          title="Active Permissions Matrix"
          subtitle="Granular capabilities resolved from your role and custom assignments"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600">
              The backend RBAC engine grants access based on discrete permissions. Below are the effective permissions currently attached to your account:
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {permissions && permissions.length > 0 ? (
                permissions.map((perm) => (
                  <Badge key={perm} variant="brand" size="md">
                    {perm}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No granular permissions assigned.
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Interactive RBAC Permission Tester */}
        <Card
          title="🧪 Live RBAC Permission Tester"
          subtitle="Test endpoint authorization rules against your active role"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600">
              Click the button below to test a live request to an admin-protected endpoint (<code>GET /api/v1/users</code>, which requires the <code>users:read</code> permission).
            </p>

            {testResult && (
              <Alert variant={testResult.success ? 'success' : 'error'}>
                {testResult.message}
              </Alert>
            )}

            <div>
              <Button
                variant="outline"
                isLoading={testLoading}
                onClick={handleTestUsersRead}
                leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              >
                Test Protected Route: GET /api/v1/users (Requires users:read)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
