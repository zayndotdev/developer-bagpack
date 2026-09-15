/**
 * ==============================================================================
 * 📍 FILE: src/pages/auth/LoginPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> User Sign-In View
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/login` (Configured in `src/constants/index.js`)
 * - Wrapped by: `src/components/common/GuestRoute.jsx`
 * - Depends on:
 *   - `src/components/layout/AuthLayout.jsx`
 *   - `src/components/ui/*.jsx` (Card, Input, Button, Alert)
 *   - `src/hooks/useAuth.js`
 *   - `src/hooks/useForm.js`
 *   - `src/utils/validators.js`
 *
 * 💡 WHY THIS EXISTS:
 * Handles user authentication. Automatically detects if the account has 2FA enabled;
 * if so, smoothly transitions to the `/login/2fa` challenge route without exposing tokens.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { SocialLogins } from '../../components/ui/SocialLogins.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useForm } from '../../hooks/useForm.js';
import { isValidEmail } from '../../utils/validators.js';
import { ROUTES } from '../../constants';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const oauthInfo = searchParams.get('oauth_info');
  const oauthError = searchParams.get('error');

  const [formError, setFormError] = useState(null);
  const [infoMessage] = useState(location.state?.message || null);

  const validate = (vals) => {
    const errs = {};
    if (!vals.email) errs.email = 'Email address is required.';
    else if (!isValidEmail(vals.email)) errs.email = 'Please enter a valid email address.';

    if (!vals.password) errs.password = 'Password is required.';
    return errs;
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
  } = useForm({ email: '', password: '' }, validate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await login(values);

      if (result.requires2FA) {
        // User has Two-Factor Authentication enabled: redirect to 2FA challenge screen
        navigate(ROUTES.TWO_FACTOR_CHALLENGE);
      } else if (result.success) {
        // Redirect to originally requested protected route or dashboard
        const destination = location.state?.from?.pathname || ROUTES.DASHBOARD;
        navigate(destination, { replace: true });
      } else {
        setFormError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Unable to connect to the authentication server.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card
        title="Welcome back"
        subtitle="Sign in to access your Developer Backpack"
        footer={
          <div className="text-center text-xs sm:text-sm">
            Don't have an account?{' '}
            <Link
              to={ROUTES.SIGNUP}
              className="font-bold text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          {oauthInfo && <Alert variant="info">{oauthInfo}</Alert>}
          {oauthError && <Alert variant="error">{oauthError}</Alert>}
          {infoMessage && <Alert variant="info">{infoMessage}</Alert>}
          {formError && <Alert variant="error">{formError}</Alert>}

          <SocialLogins mode="signin" />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Email field */}
          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={values.email}
            icon={Mail}
            error={touched.email && errors.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="email"
          />

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password <span className="text-rose-500">*</span>
              </span>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={values.password}
              icon={Lock}
              error={touched.password && errors.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </div>
        </form>
        </div>
      </Card>
    </AuthLayout>
  );
};
