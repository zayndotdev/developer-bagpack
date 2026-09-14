/**
 * ==============================================================================
 * 📍 FILE: src/pages/settings/TwoFactorSetupPage.jsx
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Page Layer -> Two-Factor Authentication Setup Wizard
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Route: `/settings/2fa/setup` (Configured in `src/constants/index.js`)
 * - Wrapped by: `src/components/common/ProtectedRoute.jsx`
 * - Depends on:
 *   - `src/hooks/useTwoFactor.js`
 *   - `src/components/layout/DashboardLayout.jsx`
 *   - `src/components/ui/*.jsx` (Card, OTPInput, QRCodeDisplay, Button, Alert)
 *   - `src/utils/helpers.js` (copyToClipboard, downloadTextFile)
 *
 * 💡 WHY THIS EXISTS:
 * A guided, 3-step security setup wizard:
 * Step 1: Select preferred method (Google Authenticator TOTP vs. Email OTP).
 * Step 2: Scan QR code / receive email OTP and verify 6-digit confirmation code.
 * Step 3: Present, copy, and download emergency backup recovery codes.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Copy,
  Download,
  Check,
  ArrowRight,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { OTPInput } from '../../components/ui/OTPInput.jsx';
import { QRCodeDisplay } from '../../components/ui/QRCodeDisplay.jsx';
import { useTwoFactor } from '../../hooks/useTwoFactor.js';
import { copyToClipboard, downloadTextFile } from '../../utils/helpers.js';
import { ROUTES, TWO_FACTOR_METHODS } from '../../constants';

export const TwoFactorSetupPage = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    setupData,
    backupCodes,
    initTotpSetup,
    confirmTotp,
    sendEmailOtp,
    confirmEmail2fa,
    setError,
  } = useTwoFactor();

  // Wizard Steps: 1 = Choose Method, 2 = Verify & Activate, 3 = Save Backup Codes
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(TWO_FACTOR_METHODS.TOTP);
  const [otpCode, setOtpCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Initialize TOTP QR code when method selected
  const handleSelectMethod = async (method) => {
    setSelectedMethod(method);
    setError(null);
    if (method === TWO_FACTOR_METHODS.TOTP) {
      const res = await initTotpSetup();
      if (res.success) setStep(2);
    } else {
      const res = await sendEmailOtp();
      if (res.success) setStep(2);
    }
  };

  const handleVerifyActivation = async (codeToVerify) => {
    setError(null);
    if (!codeToVerify || codeToVerify.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    let result;
    if (selectedMethod === TWO_FACTOR_METHODS.TOTP) {
      result = await confirmTotp(codeToVerify);
    } else {
      result = await confirmEmail2fa(codeToVerify);
    }

    if (result.success) {
      setStep(3); // Advance to backup recovery codes screen
    }
  };

  const handleCopyBackupCodes = async () => {
    const text = backupCodes.join('\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const handleDownloadBackupCodes = () => {
    const content = `====================================================\nDEVELOPER BACKPACK - 2FA EMERGENCY BACKUP RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n====================================================\n\nEach code below can only be used ONCE to access your account\nif you lose your primary two-factor authentication device.\n\n${backupCodes.join(
      '\n'
    )}\n\n====================================================\nSTORE THIS FILE IN A SECURE OFFLINE LOCATION.\n`;
    downloadTextFile('developer-backpack-backup-codes.txt', content);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <Link
            to={ROUTES.SETTINGS}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Configure Two-Factor Authentication
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Step {step} of 3 &bull;{' '}
            {step === 1
              ? 'Choose 2FA Method'
              : step === 2
              ? 'Verify Security Code'
              : 'Save Backup Codes'}
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* STEP 1: Select Method */}
        {step === 1 && (
          <Card
            title="Choose your 2FA Method"
            subtitle="Select how you prefer to receive or generate authentication challenges"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Google Authenticator */}
              <div
                onClick={() => handleSelectMethod(TWO_FACTOR_METHODS.TOTP)}
                className="cursor-pointer border-2 border-slate-200 hover:border-brand-500 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Authenticator App
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Google Authenticator, Authy, or 1Password. Works offline. (Recommended)
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
                  <span>Setup App</span> &rarr;
                </div>
              </div>

              {/* Option 2: Email OTP */}
              <div
                onClick={() => handleSelectMethod(TWO_FACTOR_METHODS.EMAIL)}
                className="cursor-pointer border-2 border-slate-200 hover:border-brand-500 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Email Security Code</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Receive a one-time 6-digit numeric OTP code in your email inbox on each login.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600">
                  <span>Setup Email OTP</span> &rarr;
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: Verify & Activate */}
        {step === 2 && (
          <Card
            title={
              selectedMethod === TWO_FACTOR_METHODS.TOTP
                ? 'Scan QR Code'
                : 'Enter Email Security Code'
            }
            subtitle={
              selectedMethod === TWO_FACTOR_METHODS.TOTP
                ? 'Open your authenticator app and scan this barcode'
                : 'We have dispatched a 6-digit code to your email address'
            }
          >
            <div className="space-y-6">
              {selectedMethod === TWO_FACTOR_METHODS.TOTP && setupData && (
                <QRCodeDisplay
                  qrCodeDataUrl={setupData.qrCodeDataUrl}
                  manualEntryKey={setupData.manualEntryKey}
                />
              )}

              <div className="space-y-4 text-center max-w-sm mx-auto">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Enter the 6-digit verification code to activate 2FA:
                </p>

                <OTPInput
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={handleVerifyActivation}
                  disabled={loading}
                />

                <div className="pt-2 flex gap-3 justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep(1);
                      setOtpCode('');
                    }}
                  >
                    Change Method
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    isLoading={loading}
                    disabled={otpCode.length !== 6}
                    onClick={() => handleVerifyActivation(otpCode)}
                  >
                    Activate 2FA
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Save Emergency Recovery Codes */}
        {step === 3 && (
          <Card
            title="Save Emergency Backup Codes"
            subtitle="Do not skip this step! Keep these codes safe."
          >
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm">
                ⚠ <strong>Notice:</strong> If you lose access to your primary authenticator device, these one-time codes are the only way to recover your account. Each code can only be used once.
              </div>

              {/* Codes 2-Column Grid */}
              <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-white border border-slate-200 text-center font-mono font-bold text-sm tracking-wider text-slate-800 rounded-lg shadow-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>

              {/* Copy & Download Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBackupCodes}
                  leftIcon={
                    copiedCodes ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )
                  }
                >
                  {copiedCodes ? 'Copied to Clipboard' : 'Copy All Codes'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBackupCodes}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download .txt
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(ROUTES.SETTINGS)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  I've Saved My Codes &bull; Finish
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
