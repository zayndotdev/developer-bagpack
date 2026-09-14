/**
 * ==============================================================================
 * 📍 FILE: src/pages/settings/ChangePasswordPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Change Password Form View (Authenticated)
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/settings/password` (Configured in `src/constants/index.js`)
 * - Wrapped by: `src/components/common/ProtectedRoute.jsx`
 * - Depends on:
 *   - `src/api/authService.js` (changePassword)
 *   - `src/components/layout/DashboardLayout.jsx`
 *   - `src/components/ui/*.jsx`
 *   - `src/utils/validators.js`
 *
 * 💡 WHY THIS EXISTS:
 * Enables logged-in users to update their credentials after verifying their
 * current password. Invalidates all other active refresh sessions on submit.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { useForm } from '../../hooks/useForm.js';
import { authService } from '../../api/authService.js';
import { isStrongPassword, getPasswordStrength } from '../../utils/validators.js';
import { ROUTES } from '../../constants';

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validate = (vals) => {
    const errs = {};
    if (!vals.currentPassword) {
      errs.currentPassword = 'Current password is required.';
    }

    if (!vals.newPassword) {
      errs.newPassword = 'New password is required.';
    } else if (!isStrongPassword(vals.newPassword)) {
      errs.newPassword =
        'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.';
    }

    if (vals.confirmNewPassword !== vals.newPassword) {
      errs.confirmNewPassword = 'New passwords do not match.';
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
    resetForm,
  } = useForm(
    { currentPassword: '', newPassword: '', confirmNewPassword: '' },
    validate
  );

  const passwordStrength = getPasswordStrength(values.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (response.success) {
        setSuccess(true);
        resetForm();
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to change password. Please check your input.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <div>
          <Link
            to={ROUTES.SETTINGS}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Change Password
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Choose a strong, unique password to secure your account.
          </p>
        </div>

        <Card>
          {success && (
            <Alert
              variant="success"
              onClose={() => setSuccess(false)}
              className="mb-4"
            >
              Password updated successfully! All other active sessions have been signed out.
            </Alert>
          )}

          {serverError && (
            <Alert variant="error" className="mb-4">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Current Password */}
            <Input
              id="currentPassword"
              name="currentPassword"
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={values.currentPassword}
              icon={Lock}
              error={touched.currentPassword && errors.currentPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />

            {/* New Password */}
            <div>
              <Input
                id="newPassword"
                name="newPassword"
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={values.newPassword}
                icon={Lock}
                error={touched.newPassword && errors.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />

              {values.newPassword && (
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

            {/* Confirm New Password */}
            <Input
              id="confirmNewPassword"
              name="confirmNewPassword"
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={values.confirmNewPassword}
              icon={Lock}
              error={touched.confirmNewPassword && errors.confirmNewPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />

            <div className="pt-2 flex gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
              >
                Update Password
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(ROUTES.SETTINGS)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};
