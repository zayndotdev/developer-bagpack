/**
 * ==============================================================================
 * 📍 FILE: src/components/ui/SocialLogins.jsx
 * 🎒 PART OF: Developer Backpack - Authentication UI
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Shared UI -> Social OAuth Providers Component (Clerk Design Standard)
 *
 * 💡 WHY THIS EXISTS:
 * Renders Clerk-style single-click Google & GitHub social authentication buttons
 * with vector SVG brand icons, crisp borders, and a sleek divider line.
 * ==============================================================================
 */

import React from 'react';
import { authService } from '../../api/authService.js';

export const GoogleIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
    />
  </svg>
);

export const GitHubIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const SocialLogins = ({ mode = 'signin' }) => {
  const handleSocialClick = (provider) => {
    const url = authService.getOAuthUrl(provider);
    window.location.href = url;
  };

  const actionText = mode === 'signup' ? 'Sign up' : 'Continue';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => handleSocialClick('google')}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/90 shadow-sm hover:shadow hover:border-slate-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 group"
        >
          <GoogleIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
          <span>Google</span>
        </button>

        {/* GitHub OAuth Button */}
        <button
          type="button"
          onClick={() => handleSocialClick('github')}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-black active:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-900 shadow-sm hover:shadow hover:border-black transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 group"
        >
          <GitHubIcon className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-150" />
          <span>GitHub</span>
        </button>
      </div>

      {/* Clerk-Style Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider select-none shrink-0">
          or continue with email
        </span>
        <div className="border-t border-slate-200 w-full" />
      </div>
    </div>
  );
};
