/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/UserButton.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Component Layer -> Clerk-Style <UserButton /> Dropdown & Trigger
 *
 * 💡 WHY THIS EXISTS:
 * Replaces plain navbar text buttons with Clerk's iconic <UserButton />:
 * - Floating circular avatar with subtle ring and status dot.
 * - Glassmorphic popover showing user identity, role, and quick actions.
 * - One-click "Manage account" launcher that opens the <UserProfile /> modal.
 * - Quick administrative shortcuts (Users, Roles) for privileged accounts.
 * - Instant sign-out.
 * ==============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Settings,
  Shield,
  Users,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Badge } from './Badge.jsx';
import { UserProfile } from './UserProfile.jsx';
import { ROUTES, ROLES, PERMISSIONS } from '../../constants';

export const UserButton = ({ appearance = {} }) => {
  const { user, logout, hasRole, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('account');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const openProfile = (tab = 'account') => {
    setProfileInitialTab(tab);
    setIsProfileModalOpen(true);
    setIsOpen(false);
  };

  if (!user) return null;

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* TRIGGER: Clerk-style circular avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer group"
        aria-label="User profile menu"
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-slate-200 group-hover:ring-brand-500 transition-all">
            {initial}
          </div>
          {/* Online status indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-2 z-50 animate-fade-in divide-y divide-slate-100">
          {/* Header Identity Card */}
          <div className="p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 ring-2 ring-slate-100">
              {initial}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 text-xs truncate">
                  {user.name}
                </span>
                <Badge variant={user.role} size="sm">
                  {user.role}
                </Badge>
              </div>
              <div className="text-slate-500 text-[11px] font-mono truncate mt-0.5">
                {user.email}
              </div>
            </div>
          </div>

          {/* Primary Action: Manage Account */}
          <div className="py-1 px-1.5">
            <button
              onClick={() => openProfile('account')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors cursor-pointer text-left"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Manage account</span>
            </button>
            <button
              onClick={() => openProfile('security')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors cursor-pointer text-left"
            >
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Security & 2FA</span>
            </button>
            <button
              onClick={() => openProfile('sessions')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors cursor-pointer text-left"
            >
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span>Active Devices</span>
            </button>
          </div>

          {/* Administrative Shortcuts (if permitted) */}
          {(hasRole(ROLES.ADMIN) || hasPermission(PERMISSIONS.USERS_READ) || hasPermission(PERMISSIONS.ROLES_MANAGE)) && (
            <div className="py-1 px-1.5">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administration
              </div>
              {(hasRole(ROLES.ADMIN) || hasPermission(PERMISSIONS.USERS_READ)) && (
                <Link
                  to={ROUTES.ADMIN_USERS}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-brand-600" />
                  <span>User Directory</span>
                </Link>
              )}
              {(hasRole(ROLES.ADMIN) || hasPermission(PERMISSIONS.ROLES_MANAGE)) && (
                <Link
                  to={ROUTES.ADMIN_ROLES}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Role Management</span>
                </Link>
              )}
            </div>
          )}

          {/* Footer Sign Out */}
          <div className="py-1 px-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* CLERK-STYLE USER PROFILE MODAL */}
      <UserProfile
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isModal={true}
        initialTab={profileInitialTab}
      />
    </div>
  );
};
export default UserButton;
