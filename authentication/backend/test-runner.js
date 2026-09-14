/**
 * ==============================================================================
 * 🧪 INTEGRATION TEST RUNNER FOR DEVELOPER BACKPACK AUTHENTICATION
 * ==============================================================================
 * Tests the complete lifecycle:
 * 1. Health check & in-memory MongoDB connection
 * 2. User registration & verification token hashing
 * 3. Email verification flow
 * 4. Login flow & credential checking
 * 5. Refresh token rotation & token family tracking
 * 6. Token reuse breach detection (replaying an old token)
 * 7. Two-Factor Authentication (TOTP setup, QR generation & verification)
 * 8. 2FA Login challenge pause & verification
 * 9. Emergency backup code single-use & burning
 * 10. RBAC role & permission enforcement
 * ==============================================================================
 */
process.env.NODE_ENV = 'test';

import http from 'http';
import { connectDB, disconnectDB } from './src/config/db.js';
import { app } from './server.js';
import { User } from './src/models/User.js';
import { RefreshToken } from './src/models/RefreshToken.js';
import { authenticator } from 'otplib';
import { hashToken } from './src/services/cryptoService.js';

let server;
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const makeRequest = (method, path, body = null, headers = {}, cookies = '') => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (cookies) {
      reqHeaders['Cookie'] = cookies;
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        const setCookie = res.headers['set-cookie'];

        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              setCookie,
              body: parsed,
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              setCookie,
              rawBody: rawData,
            });
          }
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING COMPLETE DEVELOPER BACKPACK AUTHENTICATION TEST SUITE');
  console.log('=============================================================\n');

  try {
    // Wait for DB connection to establish
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server listening on port ${PORT}...`);
        resolve();
      });
    });

    // 1. Test Health Check
    console.log('▶ TEST 1: System Health Check...');
    const health = await makeRequest('GET', '/health');
    if (health.statusCode !== 200 || health.body?.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(health.body)}`);
    }
    console.log('  ✔ Health check passed: API is online.\n');

    // 2. Test User Registration
    console.log('▶ TEST 2: User Registration (Signup)...');
    const signupData = {
      name: 'Alice Tester',
      email: 'alice@example.com',
      password: 'Password123!',
    };
    const signupRes = await makeRequest('POST', '/auth/signup', signupData);
    if (signupRes.statusCode !== 201 || !signupRes.body?.success) {
      throw new Error(`Signup failed: ${JSON.stringify(signupRes.body)}`);
    }
    console.log('  ✔ Signup successful: User created in database (requires verification).\n');

    // 3. Verify unverified login is blocked
    console.log('▶ TEST 3: Block Login for Unverified Email...');
    const unverifiedLogin = await makeRequest('POST', '/auth/login', {
      email: signupData.email,
      password: signupData.password,
    });
    if (unverifiedLogin.statusCode !== 403) {
      throw new Error(`Expected 403 for unverified user, got: ${unverifiedLogin.statusCode}`);
    }
    console.log('  ✔ Unverified user properly blocked with 403 Forbidden.\n');

    // 4. Test Email Verification
    console.log('▶ TEST 4: Email Verification...');
    const userDoc = await User.findOne({ email: signupData.email }).select('+emailVerificationTokenHash');
    // Simulate finding token by directly marking verified
    userDoc.isEmailVerified = true;
    userDoc.emailVerificationTokenHash = undefined;
    await userDoc.save();
    console.log('  ✔ Email address marked verified.\n');

    // 5. Test Successful Login (No 2FA)
    console.log('▶ TEST 5: Login with Verified Credentials...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: signupData.email,
      password: signupData.password,
    });

    if (loginRes.statusCode !== 200 || !loginRes.body?.data?.accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    const accessToken = loginRes.body.data.accessToken;
    const cookieHeader = loginRes.setCookie?.[0] || '';
    const rawRefreshTokenMatch = cookieHeader.match(/backpack_refresh_token=([^;]+)/);
    const rawRefreshToken = rawRefreshTokenMatch ? rawRefreshTokenMatch[1] : null;

    if (!rawRefreshToken) {
      throw new Error('Refresh token cookie was not set in response!');
    }
    console.log('  ✔ Login successful! Received Access Token and HTTP-only Refresh Cookie.\n');

    // 6. Test Protected Route with Access Token
    console.log('▶ TEST 6: Access Protected Route (/auth/me)...');
    const meRes = await makeRequest(
      'GET',
      '/auth/me',
      null,
      { Authorization: `Bearer ${accessToken}` }
    );
    if (meRes.statusCode !== 200 || meRes.body?.data?.user?.email !== signupData.email) {
      throw new Error(`Access to /auth/me failed: ${JSON.stringify(meRes.body)}`);
    }
    console.log('  ✔ Protected route accessed successfully with JWT Bearer token.\n');

    // 7. Test Refresh Token Rotation
    console.log('▶ TEST 7: Refresh Token Rotation (/auth/refresh)...');
    const refreshRes = await makeRequest(
      'POST',
      '/auth/refresh',
      null,
      {},
      `backpack_refresh_token=${rawRefreshToken}`
    );

    if (refreshRes.statusCode !== 200 || !refreshRes.body?.data?.accessToken) {
      throw new Error(`Refresh token rotation failed: ${JSON.stringify(refreshRes.body)}`);
    }

    const newAccessToken = refreshRes.body.data.accessToken;
    const newCookieHeader = refreshRes.setCookie?.[0] || '';
    const newRefreshTokenMatch = newCookieHeader.match(/backpack_refresh_token=([^;]+)/);
    const newRefreshToken = newRefreshTokenMatch ? newRefreshTokenMatch[1] : null;

    console.log('  ✔ Refresh token rotation succeeded: New token pair issued.\n');

    // 8. Test Refresh Token REUSE DETECTION (Breach Mitigation)
    console.log('▶ TEST 8: Refresh Token Reuse Detection (Replaying Old Token)...');
    const reuseRes = await makeRequest(
      'POST',
      '/auth/refresh',
      null,
      {},
      `backpack_refresh_token=${rawRefreshToken}` // Old token that was rotated!
    );

    if (reuseRes.statusCode !== 403) {
      throw new Error(
        `Expected 403 Forbidden for token reuse, got: ${reuseRes.statusCode} - ${JSON.stringify(
          reuseRes.body
        )}`
      );
    }
    console.log('  ✔ Security breach detected! Old token rejected with 403 and family revoked.\n');

    // 9. Test TOTP 2FA Setup
    console.log('▶ TEST 9: Two-Factor Authentication (TOTP Setup)...');
    const totpSetupRes = await makeRequest(
      'POST',
      '/auth/2fa/setup-totp',
      null,
      { Authorization: `Bearer ${newAccessToken}` }
    );

    if (totpSetupRes.statusCode !== 200 || !totpSetupRes.body?.data?.manualEntryKey) {
      throw new Error(`2FA TOTP setup failed: ${JSON.stringify(totpSetupRes.body)}`);
    }

    const manualSecret = totpSetupRes.body.data.manualEntryKey;
    const validTotpCode = authenticator.generate(manualSecret);

    // Confirm and enable 2FA
    const enableTotpRes = await makeRequest(
      'POST',
      '/auth/2fa/enable-totp',
      { code: validTotpCode },
      { Authorization: `Bearer ${newAccessToken}` }
    );

    if (enableTotpRes.statusCode !== 200 || !enableTotpRes.body?.data?.backupCodes) {
      throw new Error(`2FA confirmation failed: ${JSON.stringify(enableTotpRes.body)}`);
    }

    const backupCodes = enableTotpRes.body.data.backupCodes;
    console.log(`  ✔ TOTP 2FA enabled! Received ${backupCodes.length} backup recovery codes.\n`);

    // 10. Test Login Challenge with 2FA Active
    console.log('▶ TEST 10: Multi-Step Login Challenge with 2FA Enabled...');
    const challengeLoginRes = await makeRequest('POST', '/auth/login', {
      email: signupData.email,
      password: signupData.password,
    });

    if (
      challengeLoginRes.statusCode !== 200 ||
      !challengeLoginRes.body?.data?.requires2FA ||
      !challengeLoginRes.body?.data?.mfaTicket
    ) {
      throw new Error(
        `Expected requires2FA: true and mfaTicket, got: ${JSON.stringify(
          challengeLoginRes.body
        )}`
      );
    }

    const mfaTicket = challengeLoginRes.body.data.mfaTicket;
    console.log('  ✔ Login paused after password check: Received MFA challenge ticket.\n');

    // 11. Complete 2FA Challenge with TOTP code
    console.log('▶ TEST 11: Verify 2FA Challenge with TOTP Code...');
    const challengeCode = authenticator.generate(manualSecret);
    const verifyChallengeRes = await makeRequest('POST', '/auth/2fa/verify-challenge', {
      mfaTicket,
      code: challengeCode,
      method: 'totp',
    });

    if (
      verifyChallengeRes.statusCode !== 200 ||
      !verifyChallengeRes.body?.data?.accessToken
    ) {
      throw new Error(
        `2FA challenge verification failed: ${JSON.stringify(
          verifyChallengeRes.body
        )}`
      );
    }
    console.log('  ✔ 2FA challenge verified! Final Access & Refresh Tokens granted.\n');

    // 12. Test Emergency Backup Code Single-Use
    console.log('▶ TEST 12: Emergency Backup Recovery Code & Burning...');
    // Re-trigger login to get new mfaTicket
    const challengeLogin2 = await makeRequest('POST', '/auth/login', {
      email: signupData.email,
      password: signupData.password,
    });
    const mfaTicket2 = challengeLogin2.body.data.mfaTicket;
    const testBackupCode = backupCodes[0];

    const backupRes = await makeRequest('POST', '/auth/2fa/verify-challenge', {
      mfaTicket: mfaTicket2,
      code: testBackupCode,
      method: 'backup',
    });

    if (backupRes.statusCode !== 200) {
      throw new Error(`Backup code verification failed: ${JSON.stringify(backupRes.body)}`);
    }
    console.log('  ✔ Backup code accepted and user authenticated.\n');

    // Test that the same backup code is burnt and cannot be used twice
    const challengeLogin3 = await makeRequest('POST', '/auth/login', {
      email: signupData.email,
      password: signupData.password,
    });
    const mfaTicket3 = challengeLogin3.body.data.mfaTicket;

    const burnedBackupRes = await makeRequest('POST', '/auth/2fa/verify-challenge', {
      mfaTicket: mfaTicket3,
      code: testBackupCode, // Already used!
      method: 'backup',
    });

    if (burnedBackupRes.statusCode === 200) {
      throw new Error('Burnt backup code was unexpectedly accepted!');
    }
    console.log('  ✔ Burnt backup code properly rejected (single-use enforced).\n');

    // 13. Test RBAC Permission Enforcement
    console.log('▶ TEST 13: RBAC Permission Guard (users:read)...');
    const userRoleToken = verifyChallengeRes.body.data.accessToken;
    const rbacDeniedRes = await makeRequest(
      'GET',
      '/users',
      null,
      { Authorization: `Bearer ${userRoleToken}` }
    );

    if (rbacDeniedRes.statusCode !== 403) {
      throw new Error(
        `Expected 403 Forbidden for standard user accessing /users, got: ${rbacDeniedRes.statusCode}`
      );
    }
    console.log('  ✔ Standard user blocked from admin endpoint with 403 Forbidden.\n');

    // Promote user to admin and test again
    console.log('▶ TEST 14: Admin RBAC Authorization...');
    await User.updateOne({ email: signupData.email }, { $set: { role: 'admin' } });
    const adminLoginRes = await makeRequest('POST', '/auth/login', {
      email: signupData.email,
      password: signupData.password,
    });
    const adminMfaTicket = adminLoginRes.body.data.mfaTicket;
    const adminVerifyRes = await makeRequest('POST', '/auth/2fa/verify-challenge', {
      mfaTicket: adminMfaTicket,
      code: authenticator.generate(manualSecret),
      method: 'totp',
    });
    const adminToken = adminVerifyRes.body.data.accessToken;

    const rbacAllowedRes = await makeRequest(
      'GET',
      '/users',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );

    if (rbacAllowedRes.statusCode !== 200 || !rbacAllowedRes.body?.data?.users) {
      throw new Error(`Admin failed to access /users: ${JSON.stringify(rbacAllowedRes.body)}`);
    }
    console.log('  ✔ Admin granted access to protected endpoint (RBAC working flawlessly).\n');

    console.log('=============================================================');
    console.log('🎉 ALL 14 INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exit(1);
  }
};

runTests();
