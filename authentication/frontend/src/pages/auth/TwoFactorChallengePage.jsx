/**
 * ==============================================================================
 * 📍 FILE: src/pages/auth/TwoFactorChallengePage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Two-Factor Authentication Login Challenge Screen
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/login/2fa` (Configured in `src/constants/index.js`)
 * - Consumes:
 *   - `src/hooks/useAuth.js` (mfaPendingSession)
 *   - `src/hooks/useTwoFactor.js` (verifyChallenge, sendEmailOtp)
 *   - `src/components/ui/*.jsx` (Card, OTPInput, Button, Alert)
 *
 * 💡 WHY THIS EXISTS:
 * When a 2FA-enabled user authenticates with email & password, the login flow
 * pauses and renders this challenge view. The user verifies via their chosen
 * method (Authenticator App, Email OTP, or Emergency Backup Code) before final tokens are issued.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Key, ArrowLeft, Send } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { OTPInput } from '../../components/ui/OTPInput.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useTwoFactor } from '../../hooks/useTwoFactor.js';
import { ROUTES, TWO_FACTOR_METHODS } from '../../constants';

export const TwoFactorChallengePage = () => {
  const { mfaPendingSession } = useAuth();
  const navigate = useNavigate();
  const { verifyChallenge, sendEmailOtp, loading, error, setError } = useTwoFactor();

  // Active verification tab: 'totp', 'email', or 'backup'
  const [activeTab, setActiveTab] = useState(
    mfaPendingSession?.twoFactorMethod || TWO_FACTOR_METHODS.TOTP
  );

  const [otpCode, setOtpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // If no active MFA session exists in context (e.g. user refreshed or navigated directly), redirect to login
  useEffect(() => {
    if (!mfaPendingSession?.mfaTicket) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [mfaPendingSession, navigate]);

  // If default method is Email, auto-trigger OTP delivery on mount
  useEffect(() => {
    if (
      activeTab === TWO_FACTOR_METHODS.EMAIL &&
      !emailOtpSent &&
      mfaPendingSession?.mfaTicket
    ) {
      handleSendEmailOtp();
    }
  }, [activeTab]);

  const handleSendEmailOtp = async () => {
    setSendingEmail(true);
    setError(null);
    const result = await sendEmailOtp(mfaPendingSession.mfaTicket);
    setSendingEmail(false);
    if (result.success) {
      setEmailOtpSent(true);
    }
  };

  const handleVerify = async (codeToVerify, method = activeTab) => {
    setError(null);
    if (!codeToVerify) {
      setError('Please enter your verification code.');
      return;
    }

    const result = await verifyChallenge({
      mfaTicket: mfaPendingSession.mfaTicket,
      code: codeToVerify,
      method,
    });

    if (result.success) {
      // Login completed: navigate to dashboard
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  };

  const handleOtpComplete = (code) => {
    handleVerify(code, activeTab);
  };

  return (
    <AuthLayout>
      <Card
        title="Two-Factor Authentication"
        subtitle="Verify your identity to complete sign in"
        footer={
          <div className="text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel and return to login
            </Link>
          </div>
        }
      >
        <div className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Verification Method Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab(TWO_FACTOR_METHODS.TOTP);
                setOtpCode('');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === TWO_FACTOR_METHODS.TOTP
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>App Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab(TWO_FACTOR_METHODS.EMAIL);
                setOtpCode('');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === TWO_FACTOR_METHODS.EMAIL
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab(TWO_FACTOR_METHODS.BACKUP);
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === TWO_FACTOR_METHODS.BACKUP
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Backup Code</span>
            </button>
          </div>

          {/* TAB 1: Authenticator App (TOTP) */}
          {activeTab === TWO_FACTOR_METHODS.TOTP && (
            <div className="space-y-4 text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                Enter the 6-digit code from Google Authenticator or your authenticator app.
              </p>

              <OTPInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={handleOtpComplete}
                disabled={loading}
              />

              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={loading}
                disabled={otpCode.length !== 6}
                onClick={() => handleVerify(otpCode, TWO_FACTOR_METHODS.TOTP)}
              >
                Verify & Continue
              </Button>
            </div>
          )}

          {/* TAB 2: Email OTP */}
          {activeTab === TWO_FACTOR_METHODS.EMAIL && (
            <div className="space-y-4 text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                {emailOtpSent
                  ? `Enter the 6-digit code sent to your registered email.`
                  : 'Click below to receive a one-time verification code via email.'}
              </p>

              {emailOtpSent ? (
                <>
                  <OTPInput
                    value={otpCode}
                    onChange={setOtpCode}
                    onComplete={handleOtpComplete}
                    disabled={loading}
                  />

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="primary"
                      fullWidth
                      size="lg"
                      isLoading={loading}
                      disabled={otpCode.length !== 6}
                      onClick={() => handleVerify(otpCode, TWO_FACTOR_METHODS.EMAIL)}
                    >
                      Verify & Continue
                    </Button>

                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={sendingEmail}
                      className="text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline"
                    >
                      Resend code to email
                    </button>
                  </div>
                </>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={sendingEmail}
                  onClick={handleSendEmailOtp}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send Security Code
                </Button>
              )}
            </div>
          )}

          {/* TAB 3: Emergency Backup Code */}
          {activeTab === TWO_FACTOR_METHODS.BACKUP && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600">
                Lost access to your primary 2FA method? Enter one of your emergency backup recovery codes (e.g.{' '}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                  ABCD-1234
                </code>
                ).
              </p>

              <Input
                label="Backup Recovery Code"
                placeholder="XXXX-XXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                icon={Key}
                required
              />

              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={loading}
                disabled={!backupCode.trim()}
                onClick={() => handleVerify(backupCode, TWO_FACTOR_METHODS.BACKUP)}
              >
                Use Backup Code
              </Button>
            </div>
          )}
        </div>
      </Card>
    </AuthLayout>
  );
};
