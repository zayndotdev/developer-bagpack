/**
 * ==============================================================================
 * 📍 FILE: src/pages/settings/SettingsPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Account Settings & Security Dashboard
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/settings` (Configured in `src/constants/index.js`)
 * - Wrapped by: `src/components/common/ProtectedRoute.jsx`
 * - Interacts with:
 *   - `src/hooks/useAuth.js`
 *   - `src/hooks/useTwoFactor.js`
 *   - `src/components/layout/DashboardLayout.jsx`
 *   - `src/components/ui/*.jsx` (Card, Badge, Button, Input, Modal, Alert)
 *
 * 💡 WHY THIS EXISTS:
 * Hub for managing user credentials, viewing/updating profile information,
 * disabling or reconfiguring Two-Factor Authentication, and viewing backup codes.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  User,
  Mail,
  Copy,
  Download,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useTwoFactor } from '../../hooks/useTwoFactor.js';
import { copyToClipboard, downloadTextFile } from '../../utils/helpers.js';
import { ROUTES } from '../../constants';
import { userService } from '../../api/userService.js';

export const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const { disable2fa, loading: twoFactorLoading } = useTwoFactor();

  // Profile update state
  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Disable 2FA modal state
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await userService.updateProfile({ name });
      await refreshUser();
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleConfirmDisable2fa = async (e) => {
    e.preventDefault();
    setDisableError(null);
    const result = await disable2fa(disablePassword);
    if (result.success) {
      setIsDisableModalOpen(false);
      setDisablePassword('');
    } else {
      setDisableError(result.error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal profile, credentials, and multi-factor security settings.
          </p>
        </div>

        {/* SECTION 1: Personal Profile */}
        <Card title="Profile Information" subtitle="Update your display name">
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            {profileMessage && (
              <Alert variant={profileMessage.type}>{profileMessage.text}</Alert>
            )}

            <Input
              label="Email Address"
              type="email"
              value={user?.email || ''}
              disabled
              icon={Mail}
              helperText="Email address cannot be changed."
            />

            <Input
              label="Display Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={profileSaving}
            >
              Save Profile Changes
            </Button>
          </form>
        </Card>

        {/* SECTION 2: Two-Factor Authentication Management */}
        <Card
          title="Two-Factor Authentication (2FA)"
          subtitle="Add an extra layer of protection to your account"
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    user?.twoFactorEnabled
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {user?.twoFactorEnabled ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      {user?.twoFactorEnabled
                        ? `2FA is Active (${user.twoFactorMethod?.toUpperCase()})`
                        : '2FA is Currently Disabled'}
                    </h3>
                    <Badge
                      variant={user?.twoFactorEnabled ? 'emerald' : 'amber'}
                      size="sm"
                    >
                      {user?.twoFactorEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {user?.twoFactorEnabled
                      ? 'Your account requires an authenticator code or email OTP on every login.'
                      : 'Protect your account from credential stuffing by requiring a second verification step.'}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {user?.twoFactorEnabled ? (
                  <>
                    <Link to={ROUTES.SETTINGS_2FA}>
                      <Button variant="outline" size="sm">
                        Re-setup
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsDisableModalOpen(true)}
                    >
                      Disable 2FA
                    </Button>
                  </>
                ) : (
                  <Link to={ROUTES.SETTINGS_2FA}>
                    <Button variant="primary" size="sm">
                      Enable 2FA
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 3: Password & Security */}
        <Card
          title="Password & Credentials"
          subtitle="Keep your account credentials fresh and secure"
        >
          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="font-semibold text-sm text-slate-900">
                Account Password
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Updating your password will revoke all other active refresh sessions.
              </p>
            </div>
            <Link to={ROUTES.SETTINGS_PASSWORD}>
              <Button variant="outline" size="sm" leftIcon={<Lock className="w-4 h-4" />}>
                Change Password
              </Button>
            </Link>
          </div>
        </Card>

        {/* MODAL: Disable 2FA Confirmation */}
        <Modal
          isOpen={isDisableModalOpen}
          onClose={() => setIsDisableModalOpen(false)}
          title="Disable Two-Factor Authentication?"
          subtitle="Enter your password to confirm disabling 2FA"
        >
          <form onSubmit={handleConfirmDisable2fa} className="space-y-4">
            {disableError && <Alert variant="error">{disableError}</Alert>}

            <p className="text-xs text-slate-600">
              Disabling 2FA reduces your account security. You will only need your email
              and password to sign in.
            </p>

            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsDisableModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={twoFactorLoading}
              >
                Confirm & Disable
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
