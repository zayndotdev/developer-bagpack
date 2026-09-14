/**
 * ==============================================================================
 * 📍 FILE: src/pages/auth/ResetPasswordPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Password Reset Form View (accessed via email link)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/reset-password/:token` (Configured in `src/constants/index.js`)
 * - Interacts with:
 *   - `src/api/authService.js` (resetPassword)
 *   - `src/utils/validators.js` (isStrongPassword, getPasswordStrength)
 *   - `src/components/layout/AuthLayout.jsx`
 *   - `src/components/ui/*.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Allows the user to securely set a new password using the unexpired reset token
 * delivered to their inbox. Invalidates all existing sessions upon completion.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { useForm } from '../../hooks/useForm.js';
import { authService } from '../../api/authService.js';
import {
  isStrongPassword,
  getPasswordStrength,
} from '../../utils/validators.js';
import { ROUTES } from '../../constants';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validate = (vals) => {
    const errs = {};
    if (!vals.password) {
      errs.password = 'New password is required.';
    } else if (!isStrongPassword(vals.password)) {
      errs.password =
        'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.';
    }

    if (vals.confirmPassword !== vals.password) {
      errs.confirmPassword = 'Passwords do not match.';
    }
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
  } = useForm({ password: '', confirmPassword: '' }, validate);

  const passwordStrength = getPasswordStrength(values.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await authService.resetPassword(token, {
        password: values.password,
      });

      if (response.success) {
        setSuccess(true);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Reset link is invalid or has expired. Please request a new link.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <Card
          title="Password Updated"
          subtitle="Your account password has been changed"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Success!</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your password has been updated. All other active sessions have been
              revoked for your security.
            </p>

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => navigate(ROUTES.LOGIN)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In with New Password
              </Button>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card
        title="Set New Password"
        subtitle="Choose a strong, memorable password"
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
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}

          {/* New Password */}
          <div>
            <Input
              id="password"
              name="password"
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={values.password}
              icon={Lock}
              error={touched.password && errors.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="new-password"
            />

            {/* Dynamic Strength Meter */}
            {values.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Strength</span>
                  <span>{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        step <= passwordStrength.score
                          ? passwordStrength.color
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={values.confirmPassword}
            icon={Lock}
            error={touched.confirmPassword && errors.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="new-password"
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
};
