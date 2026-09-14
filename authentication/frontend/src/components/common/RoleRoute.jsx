/**
 * ==============================================================================
 * 📍 FILE: src/components/common/RoleRoute.jsx
 * 🎒 PART OF: Developer Backpack - Route Guards
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Route Guard Layer -> Role & Permission Enforcer
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Mounted in: `src/App.jsx` (Guards admin routes like `/admin/roles`)
 * - Depends on: `src/hooks/useAuth.js`
 *
 * 💡 WHY THIS EXISTS:
 * Protects specific views based on roles (e.g. `allowedRoles={['admin']}`) or
 * granular permissions (e.g. `requiredPermission="roles:manage"`).
 * If the user lacks the credentials, redirects to the friendly Unauthorized page.
 * ==============================================================================
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants';

export const RoleRoute = ({
  children,
  allowedRoles = [],
  requiredPermission = null,
}) => {
  const { user, hasRole, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // 1. Check role allowance
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // 2. Check granular permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children;
};
