/**
 * ==============================================================================
 * 📍 FILE: src/hooks/useAuth.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Custom Hooks Layer -> Auth Context Consumer Hook
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - All auth pages (`src/pages/`)
 *   - All route guards (`src/components/common/*.jsx`)
 *   - Navigation bar (`src/components/layout/Navbar.jsx`)
 *
 * 💡 WHY THIS EXISTS:
 * Custom hook to safely consume AuthContext, throwing a descriptive error if
 * invoked outside of an AuthProvider tree.
 * ==============================================================================
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider> wrapper.');
  }
  return context;
};
