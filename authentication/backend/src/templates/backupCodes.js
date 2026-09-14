/**
 * ==============================================================================
 * 📍 FILE: src/templates/backupCodes.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Presentation Layer -> Transactional Email Template: 2FA Backup Recovery Codes
 *
 * 🔗 CROSS-FILE REFERENCES:
 * - Imported by: `src/services/emailService.js`
 *
 * 💡 WHY THIS EXISTS:
 * When users enable 2FA or generate new emergency codes, sending a copy to their
 * verified email provides a persistent fallback record in case they lose their
 * phone or hardware authenticator.
 * ==============================================================================
 */

export const getBackupCodesHtml = ({ name, codes }) => {
  const codesHtml = codes
    .map(
      (code) =>
        `<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; font-family:monospace; font-weight:700; font-size:15px; letter-spacing:1px; text-align:center;">${code}</div>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your 2FA Backup Recovery Codes</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 24px; }
    .codes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 24px 0; }
    .footer { padding: 20px 24px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Emergency Recovery Codes</h1>
    </div>
    <div class="content">
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 0;">2FA Backup Codes Generated</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Two-factor authentication backup codes were recently generated for your account. Each code below can be used <strong>exactly once</strong> to log in if you ever lose access to your primary 2FA method.</p>
      
      <div class="codes-grid">
        ${codesHtml}
      </div>

      <p style="font-size: 14px; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px;">
        ⚠ <strong>Keep these codes secret and secure.</strong> Store them in a password manager or print them out and keep them in a safe place.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Developer Backpack Authentication System. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
};
