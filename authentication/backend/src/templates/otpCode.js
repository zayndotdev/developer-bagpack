/**
 * ==============================================================================
 * 📍 FILE: src/templates/otpCode.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Presentation Layer -> Transactional Email Template: 2FA Email OTP
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by: `src/services/emailService.js`
 *
 * 💡 WHY THIS EXISTS:
 * Renders an attention-grabbing, centered 6-digit numeric verification code
 * with letter-spaced typography and strict 10-minute validity warnings.
 * ==============================================================================
 */

export const getOtpCodeHtml = ({ name, otp }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your One-Time Security Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #4f46e5; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 24px; text-align: center; }
    .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px 24px; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0f172a; margin: 24px auto; display: inline-block; }
    .footer { padding: 20px 24px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Security Verification</h1>
    </div>
    <div class="content">
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 0;">Two-Factor Authentication Code</h2>
      <p style="text-align: left;">Hi ${name || 'there'},</p>
      <p style="text-align: left;">Use the 6-digit security code below to complete your authentication challenge.</p>
      
      <div>
        <div class="otp-box">${otp}</div>
      </div>

      <p style="font-size: 14px; color: #64748b;">This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
      <p style="font-size: 13px; color: #ef4444;">Never share this code with anyone. Developer Backpack support will never ask for your authentication codes.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Developer Backpack Authentication System. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
