/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/Input.jsx
 * 🎒 PART OF: Developer Backpack - Shared UI Library
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI Components -> Form Input with Icon & Password Toggle Support
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Used in all forms: Login, Signup, Password Reset, Settings, etc.
 *
 * 💡 WHY THIS EXISTS:
 * Standardizes form inputs: floating/clear labels, inline validation errors,
 * prefix icons, and automatic password reveal toggle to ensure visual consistency.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  id,
  name,
  label,
  type = 'text',
  value,
  placeholder,
  error,
  helperText,
  icon: Icon = null,
  disabled = false,
  required = false,
  onChange,
  onBlur,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const inputId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={effectiveType}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          className={`block w-full rounded-xl text-sm transition-all duration-200 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${isPassword ? 'pr-11' : 'pr-3.5'} py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
          } outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-rose-500 font-medium animate-slide-up">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
