/**
 * ==============================================================================
 * 📍 FILE: src/pages/auth/SignUpPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> User Registration View
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/signup` (Configured in `src/constants/index.js`)
 * - Wrapped by: `src/components/common/GuestRoute.jsx`
 * - Interacts with:
 *   - `src/api/authService.js` (signup, resendVerification)
 *   - `src/utils/validators.js` (isStrongPassword, getPasswordStrength)
 *   - `src/components/ui/*.jsx`
 *
 * 💡 WHY THIS EXISTS:
 * Handles new account creation with real-time password strength scoring,
 * strict validation feedback, and verification email instructions.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { SocialLogins } from '../../components/ui/SocialLogins.jsx';
import { useForm } from '../../hooks/useForm.js';
import { authService } from '../../api/authService.js';
import {
  isValidEmail,
  isStrongPassword,
  getPasswordStrength,
} from '../../utils/validators.js';
import { ROUTES } from '../../constants';

export const SignUpPage = () => {
  const [serverError, setServerError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const validate = (vals) => {
    const errs = {};
    if (!vals.name || vals.name.trim().length === 0) errs.name = 'Full name is required.';
    else if (vals.name.length > 60) errs.name = 'Name cannot exceed 60 characters.';

    if (!vals.email) errs.email = 'Email address is required.';
    else if (!isValidEmail(vals.email)) errs.email = 'Please enter a valid email address.';

    if (!vals.password) errs.password = 'Password is required.';
    else if (!isStrongPassword(vals.password)) {
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
  } = useForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    validate
  );

  const passwordStrength = getPasswordStrength(values.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await authService.signup({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (response.success) {
        setSuccessData({
          email: values.email,
          name: values.name,
        });
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Unable to complete account registration.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully registered, show verification instructions
  if (successData) {
    return (
      <AuthLayout>
        <Card
          title="Verify your email"
          subtitle={`We've sent an activation link to ${successData.email}`}
          footer={
            <div className="text-center text-xs sm:text-sm">
              Ready to log in?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Go to Sign In
              </Link>
            </div>
          }
        >
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Please check your inbox (and spam folder) and click the verification
              link inside to activate your account.
            </p>

            <div className="pt-2">
              <Link to={ROUTES.LOGIN}>
                <Button variant="primary" fullWidth size="lg">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card
        title="Create your account"
        subtitle="Get started with Developer Backpack today"
        footer={
          <div className="text-center text-xs sm:text-sm">
            Already have an account?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-bold text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          <SocialLogins mode="signup" />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {serverError && <Alert variant="error">{serverError}</Alert>}

          {/* Full Name */}
          <Input
            id="name"
            name="name"
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            value={values.name}
            icon={User}
            error={touched.name && errors.name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="name"
          />

          {/* Email Address */}
          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            value={values.email}
            icon={Mail}
            error={touched.email && errors.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="email"
          />

          {/* Password */}
          <div>
            <Input
              id="password"
              name="password"
              label="Password"
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

            {/* Password Strength Indicator */}
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
            label="Confirm Password"
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
              Create Account
            </Button>
          </div>
        </form>
        </div>
      </Card>
    </AuthLayout>
  );
};
