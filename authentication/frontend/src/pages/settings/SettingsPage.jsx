/**
 * ==============================================================================
 * 📍 FILE: src/pages/settings/SettingsPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Clerk-Style Account Center & Settings Dashboard
 *
 * 💡 WHY THIS EXISTS:
 * Renders the full-screen Clerk-style <UserProfile /> component for unified
 * account profile, security credentials, active devices, and danger zone management.
 * ==============================================================================
 */

import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx';
import { UserProfile } from '../../components/ui/UserProfile.jsx';

export const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-2">
        <UserProfile isModal={false} />
      </div>
    </DashboardLayout>
  );
};
export default SettingsPage;
