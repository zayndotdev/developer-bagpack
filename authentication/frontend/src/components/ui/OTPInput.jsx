/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/OTPInput.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> 6-Digit Segmented OTP Input
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used in:
 *   - `src/pages/auth/TwoFactorChallengePage.jsx`
 *   - `src/pages/settings/TwoFactorSetupPage.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Provides the modern Dribbble/Figma standard for 2FA code entry:
 * 1. 6 isolated, high-contrast segmented boxes.
 * 2. Instant auto-advance on keystroke.
 * 3. Backspace auto-retreats to previous box.
 * 4. Clipboard paste listener that automatically splits 6-digit codes across inputs.
 * 5. Mobile numeric keypad triggering (`inputMode="numeric"`).
 * ==============================================================================
 */

import React, { useRef, useState, useEffect } from 'react';

export const OTPInput = ({
  length = 6,
  value = '',
  onChange,
  onComplete = null,
  disabled = false,
  error = false,
  className = '',
}) => {
  const [digits, setDigits] = useState(
    Array.from({ length }, (_, i) => value[i] || '')
  );
  const inputRefs = useRef([]);

  useEffect(() => {
    // Synchronize if external value changes (e.g. form reset)
    const newDigits = Array.from({ length }, (_, i) => value[i] || '');
    setDigits(newDigits);
  }, [value, length]);

  const triggerChange = (newDigits) => {
    setDigits(newDigits);
    const combined = newDigits.join('');
    if (onChange) onChange(combined);
    if (combined.length === length && !newDigits.includes('') && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[index]) {
        // Clear current digit
        newDigits[index] = '';
        triggerChange(newDigits);
      } else if (index > 0) {
        // Move back and clear previous
        newDigits[index - 1] = '';
        triggerChange(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index, e) => {
    const rawVal = e.target.value;
    // Keep only numeric characters
    const numericChar = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = numericChar;
    triggerChange(newDigits);

    // Auto-advance to next input if digit entered
    if (numericChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData('text').trim();
    // Extract first 6 digits from pasted content
    const numericMatches = pastedData.replace(/\D/g, '').slice(0, length);

    if (numericMatches) {
      const newDigits = Array.from({ length }, (_, i) => numericMatches[i] || '');
      triggerChange(newDigits);

      // Focus the appropriate input box
      const nextFocusIndex = Math.min(numericMatches.length, length - 1);
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={index === 0}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onChange={(e) => handleChange(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-200 outline-none select-none ${
            error
              ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : digit
              ? 'border-brand-500 bg-brand-50/20 text-slate-900 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
              : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
          } disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
};
