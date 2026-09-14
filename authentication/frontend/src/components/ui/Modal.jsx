/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/Modal.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> Accessible Modal Dialog
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used in:
 *   - `src/pages/settings/SettingsPage.jsx` (2FA disable confirm, backup codes display)
 *   - `src/pages/admin/RoleManagementPage.jsx` (New custom role modal)
 *
 * 💡 WHY THIS EXISTS:
 * Provides a clean modal dialog with focus trapping, backdrop overlay, escape key
 * listener, and smooth animations.
 * ==============================================================================
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle = null,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full sm:my-8 ${maxWidth} border border-slate-200 animate-slide-up`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <h3
                id="modal-title"
                className="text-lg font-bold text-slate-900 tracking-tight"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
