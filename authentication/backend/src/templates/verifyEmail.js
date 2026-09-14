/**
 * ==============================================================================
 * 📍 FILE: src/templates/verifyEmail.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Presentation Layer -> Transactional Email Template: Email Verification
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by: `src/services/emailService.js`
 *
 * 💡 WHY THIS EXISTS:
 * Provides a modern, responsive, high-converting HTML email with consistent
 * branding, high contrast action button, and an accessible raw URL fallback.
 * ==============================================================================
 */

export const getVerifyEmailHtml = ({ name, verifyUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #4f46e5; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 24px; }
    .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0; text-align: center; }
    .footer { padding: 20px 24px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .link-fallback { word-break: break-all; color: #6366f1; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎒 Developer Backpack</h1>
    </div>
    <div class="content">
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 0;">Verify your email address</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Thank you for signing up with Developer Backpack! Please confirm your email address by clicking the button below to activate your account.</p>
      
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="button" target="_blank">Verify My Email</a>
      </div>

      <p style="font-size: 14px; color: #64748b;">This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Button not working? Copy and paste this URL into your browser:</p>
      <a href="${verifyUrl}" class="link-fallback">${verifyUrl}</a>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Developer Backpack Authentication System. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
