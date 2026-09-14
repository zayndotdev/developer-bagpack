/**
 * ==============================================================================
 * 📍 FILE: src/pages/auth/VerifyEmailPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Email Address Verification Handler View
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/verify-email` (Configured in `src/constants/index.js`)
 * - Interacts with:
 *   - `src/api/authService.js` (verifyEmail, resendVerification)
 *   - `src/components/layout/AuthLayout.jsx`
 *   - `src/components/ui/*.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Handles incoming verification links (`?token=...&email=...`), executes the
 * cryptographic hash verification with the backend, and provides a built-in
 * "Resend verification email" fallback form.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { authService } from '../../api/authService.js';
import { isValidEmail } from '../../utils/validators.js';
import { ROUTES } from '../../constants';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [loading, setLoading] = useState(!!(token && emailParam));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // State for resend form
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState(emailParam || '');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  useEffect(() => {
    // If token and email are in the query string, automatically attempt verification
    if (token && emailParam) {
      const executeVerification = async () => {
        try {
          const response = await authService.verifyEmail({
            token,
            email: emailParam,
          });
          if (response.success) {
            setSuccess(true);
          }
        } catch (err) {
          setError(
            err.response?.data?.message ||
              'Invalid or expired verification link. Please request a new one.'
          );
        } finally {
          setLoading(false);
        }
      };

      executeVerification();
    }
  }, [token, emailParam]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || !isValidEmail(resendEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setResendLoading(true);
    setResendMessage(null);
    try {
      const response = await authService.resendVerification({ email: resendEmail });
      setResendMessage(
        response.message ||
          'If an unverified account exists, a fresh verification email has been sent.'
      );
      setShowResend(false);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to resend verification email.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card
        title="Email Verification"
        subtitle="Confirming your account email address"
        footer={
          <div className="text-center text-xs sm:text-sm">
            Remember your credentials?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Sign In
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          {resendMessage && <Alert variant="success">{resendMessage}</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          {/* 1. Loading State */}
          {loading && (
            <div className="py-8 text-center space-y-3">
              <Spinner size="lg" className="text-brand-600 mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                Verifying your email token with the server...
              </p>
            </div>
          )}

          {/* 2. Success State */}
          {!loading && success && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Email Verified Successfully!
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your email has been confirmed. Your account is now fully active and ready to use.
              </p>
              <div className="pt-2">
                <Link to={ROUTES.LOGIN}>
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* 3. Link Expired or No Token: Offer Resend Form */}
          {!loading && !success && (
            <div className="space-y-4 pt-2">
              {!showResend ? (
                <div className="text-center space-y-4 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
                    <Mail className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Need a new activation link? Click below to resend the verification email to your address.
                  </p>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowResend(true)}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Resend Verification Email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3 pt-2">
                  <Input
                    label="Account Email"
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    icon={Mail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      isLoading={resendLoading}
                    >
                      Send Fresh Link
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowResend(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </Card>
    </AuthLayout>
  );
};
