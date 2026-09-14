/**
 * ==============================================================================
 * 📍 FILE: src/pages/auth/ForgotPasswordPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Password Reset Request Form View
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/forgot-password` (Configured in `src/constants/index.js`)
 * - Interacts with:
 *   - `src/api/authService.js` (forgotPassword)
 *   - `src/components/layout/AuthLayout.jsx`
 *   - `src/components/ui/*.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Initiates the self-service password recovery flow by collecting the user's email
 * and requesting a single-use, 1-hour reset token from the backend.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { authService } from '../../api/authService.js';
import { isValidEmail } from '../../utils/validators.js';
import { ROUTES } from '../../constants';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to process password reset request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card
        title="Reset Password"
        subtitle="We will send a secure recovery link to your email"
        footer={
          <div className="text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        }
      >
        {submitted ? (
          <div className="text-center py-3 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              If an account is associated with <strong>{email}</strong>, we have
              dispatched an email with instructions to reset your password.
            </p>

            <p className="text-xs text-slate-400">
              Be sure to check your spam or junk folder if you don't see it within a few minutes.
            </p>

            <div className="pt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setSubmitted(false)}
              >
                Send to another email
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <Alert variant="error">{error}</Alert>}

            <Input
              id="email"
              name="email"
              label="Account Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              icon={Mail}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send Recovery Link
              </Button>
            </div>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
};
