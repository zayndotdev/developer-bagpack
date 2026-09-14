/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/Alert.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> Status Notification Alert
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used across all forms to display API error responses and success confirmations
 *
 * 💡 WHY THIS EXISTS:
 * Standardizes user feedback banners with semantic colors, icons, and accessible markup.
 * ==============================================================================
 */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

export const Alert = ({
  children,
  title = null,
  variant = 'info',
  onClose = null,
  className = '',
}) => {
  if (!children && !title) return null;

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      icon: Info,
      iconColor: 'text-indigo-600',
    },
  };

  const current = config[variant] || config.info;
  const IconComponent = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-slide-up ${current.bg} ${className}`}
    >
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />

      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1 rounded-lg focus:outline-none"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
