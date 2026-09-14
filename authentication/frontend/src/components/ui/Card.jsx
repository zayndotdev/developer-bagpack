/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/Card.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> Card Surface Container
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used in:
 *   - All auth pages (Form card wrapper)
 *   - Dashboard widgets & Settings panels
 *
 * 💡 WHY THIS EXISTS:
 * Enforces the design system's container style: 1px subtle slate border,
 * rounded-2xl geometry, gentle atmospheric shadow, and structured header/footer slots.
 * ==============================================================================
 */

import React from 'react';

export const Card = ({
  children,
  title = null,
  subtitle = null,
  badge = null,
  headerAction = null,
  footer = null,
  className = '',
}) => {
  const hasHeader = title || subtitle || badge || headerAction;

  return (
    <div
      className={`bg-white border border-slate-200/80 shadow-card rounded-2xl overflow-hidden transition-all duration-200 ${className}`}
    >
      {hasHeader && (
        <div className="px-6 sm:px-8 pt-8 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              {badge && <div className="mb-2">{badge}</div>}
              {title && (
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8">{children}</div>

      {footer && (
        <div className="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
};
