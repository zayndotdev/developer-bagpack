/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/Badge.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> Role & Permission Indicator Badge
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used in:
 *   - `src/components/layout/Navbar.jsx` (Shows user role badge)
 *   - `src/pages/dashboard/DashboardPage.jsx`
 *   - `src/pages/admin/RoleManagementPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Color-coded visual pills indicating roles (admin=violet, moderator=blue, user=slate)
 * and active granular permissions.
 * ==============================================================================
 */

import React from 'react';

export const Badge = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    moderator: 'bg-blue-50 text-blue-700 border-blue-200',
    user: 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border tracking-wide uppercase ${
        variants[variant] || variants.slate
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
};
