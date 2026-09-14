/**
 * ==============================================================================
 * 📍 FILE: src/components/layout/DashboardLayout.jsx
 * 🎒 PART OF: Developer Backpack - Layout Components
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Layout Layer -> Authenticated Application Layout
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Wraps:
 *   - `src/pages/dashboard/DashboardPage.jsx`
 *   - `src/pages/settings/SettingsPage.jsx`
 *   - `src/pages/settings/TwoFactorSetupPage.jsx`
 *   - `src/pages/settings/ChangePasswordPage.jsx`
 *   - `src/pages/admin/RoleManagementPage.jsx`
 * - Depends on: `src/components/layout/Navbar.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Mounts the persistent top navigation bar and provides responsive maximum-width
 * constraints for internal application screens.
 * ==============================================================================
 */

import React from 'react';
import { Navbar } from './Navbar.jsx';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Developer Backpack Authentication & Authorization Engine &bull; Built with React, Express, and MongoDB
        </div>
      </footer>
    </div>
  );
};
