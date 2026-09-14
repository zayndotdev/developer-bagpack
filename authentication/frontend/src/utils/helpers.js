/**
 * ==============================================================================
 * 📍 FILE: src/utils/helpers.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Utility Layer -> General Helper Functions
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by:
 *   - `src/pages/settings/TwoFactorSetupPage.jsx` (Copy secret, download backup codes)
 *   - `src/components/ui/QRCodeDisplay.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Reusable utility functions extracted out of components to keep UI code declarative.
 * ==============================================================================
 */

/**
 * Copies text to the system clipboard with legacy fallback support.
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
};

/**
 * Triggers an in-browser download of a text file (e.g. for saving 2FA backup codes).
 */
export const downloadTextFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats a Date object or ISO string into a human-readable format.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};
