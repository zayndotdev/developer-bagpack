/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/Spinner.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> Animated SVG Loading Spinner
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used by:
 *   - `src/components/ui/Button.jsx` (Shows inline during form submissions)
 *   - Route guards and full-page loading states
 * ==============================================================================
 */

import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
