/**
 * ==============================================================================
 * 📍 FILE: src/components/layout/Navbar.jsx
 * 🎒 PART OF: Developer Backpack - Layout Components
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Layout Layer -> Top Application Navigation Bar
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted in: `src/components/layout/DashboardLayout.jsx`
 * - Interacts with:
 *   - `src/hooks/useAuth.js` (User session, role, permissions, logout)
 *   - `src/constants/index.js` (ROUTES, ROLES)
 *   - `src/components/ui/Badge.jsx`
 *   - `src/components/ui/Button.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Provides clean, responsive navigation, displays active role and user identity,
 * and enables seamless switching between Dashboard, Settings, and Role Management.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES, ROLES } from '../../constants';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { UserButton } from '../ui/UserButton.jsx';
import {
  Shield,
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, hasRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link
              to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
              className="flex items-center gap-2.5 text-slate-900 font-bold text-lg tracking-tight group"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <span>Developer Backpack</span>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center ml-8 space-x-1">
                <Link
                  to={ROUTES.DASHBOARD}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(ROUTES.DASHBOARD)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {/* User Management (Dynamic: users:read or Admin) */}
                {(hasRole(ROLES.ADMIN) || hasPermission('users:read')) && (
                  <Link
                    to={ROUTES.ADMIN_USERS}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(ROUTES.ADMIN_USERS)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Users
                  </Link>
                )}

                {/* Role Management (Dynamic: roles:manage or Admin) */}
                {(hasRole(ROLES.ADMIN) || hasPermission('roles:manage')) && (
                  <Link
                    to={ROUTES.ADMIN_ROLES}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(ROUTES.ADMIN_ROLES)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Role Management
                  </Link>
                )}

                <Link
                  to={ROUTES.SETTINGS}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(ROUTES.SETTINGS) || location.pathname.startsWith('/settings')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Right User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <UserButton />
            ) : (
              <div className="flex items-center gap-2">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.SIGNUP}>
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="p-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
                <Badge variant={user?.role} size="sm">
                  {user?.role}
                </Badge>
              </div>

              <Link
                to={ROUTES.DASHBOARD}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {(hasRole(ROLES.ADMIN) || hasPermission('users:read')) && (
                <Link
                  to={ROUTES.ADMIN_USERS}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <Users className="w-4 h-4" />
                  Users
                </Link>
              )}

              {(hasRole(ROLES.ADMIN) || hasPermission('roles:manage')) && (
                <Link
                  to={ROUTES.ADMIN_ROLES}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <Shield className="w-4 h-4" />
                  Role Management
                </Link>
              )}

              <Link
                to={ROUTES.SETTINGS}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>

              <div className="pt-2">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" fullWidth>
                  Sign In
                </Button>
              </Link>
              <Link to={ROUTES.SIGNUP} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth>
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
