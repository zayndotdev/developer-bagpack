/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/QRCodeDisplay.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> 2FA Authenticator QR Code & Secret Key Card
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used in: `src/pages/settings/TwoFactorSetupPage.jsx`
 * - Depends on:
 *   - `src/utils/helpers.js` (copyToClipboard)
 *   - `src/components/ui/Button.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Presents the Google Authenticator TOTP enrollment instructions cleanly:
 * displays the scannable QR code alongside the manual entry secret with an
 * instant copy button and friendly UX guidance.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { copyToClipboard } from '../../utils/helpers.js';

export const QRCodeDisplay = ({
  qrCodeDataUrl,
  manualEntryKey,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!manualEntryKey) return;
    const success = await copyToClipboard(manualEntryKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex flex-col items-center p-6 bg-slate-50 border border-slate-200/80 rounded-2xl ${className}`}
    >
      <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl mb-4">
        {qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="Scan this QR code in Google Authenticator or Authy"
            className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
            Loading QR Code...
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Scan with Google Authenticator, 1Password, or Authy</span>
      </div>

      {manualEntryKey && (
        <div className="w-full mt-2 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 mb-1.5">
            Can't scan? Enter this secret key manually:
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 text-xs font-mono font-semibold rounded-lg tracking-wider">
              {manualEntryKey}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 focus:outline-none"
              title="Copy secret key"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
