/**
 * ==============================================================================
 * 📍 FILE: src/controllers/oauthController.js
 * 🎒 PART OF: Developer Backpack - Authentication & Authorization System
 * ==============================================================================
 *
 * 🗺️ YOU ARE HERE:
 * Controller Layer -> Social Logins (Google & GitHub OAuth 2.0)
 *
 * 💡 WHY THIS EXISTS:
 * Handles single-click social authentication flows modeled after Clerk:
 * 1. getProviders: Reports configured OAuth providers.
 * 2. googleAuth & googleCallback: Google OAuth 2.0 flow.
 * 3. githubAuth & githubCallback: GitHub OAuth 2.0 flow.
 * 4. Automatic Dev Feedback: If client credentials are not yet configured in .env,
 *    gracefully informs the client with setup instructions.
 * ==============================================================================
 */

import crypto from 'crypto';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { ROLES, COOKIE_NAMES } from '../config/constants.js';
import { createRefreshToken, generateAccessToken } from '../services/tokenService.js';
import { getUserEffectivePermissions } from '../middleware/rbacMiddleware.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

/**
 * Returns available OAuth providers status
 * Route: GET /api/v1/auth/oauth/providers
 */
export const getProviders = (req, res) => {
  return ApiResponse.success(res, 'OAuth providers configuration.', {
    google: {
      enabled: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    },
    github: {
      enabled: Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
    },
  });
};

/**
 * Initiate Google OAuth
 * Route: GET /api/v1/auth/oauth/google
 */
export const googleAuth = (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/auth/oauth/google/callback`;

  if (!GOOGLE_CLIENT_ID) {
    // In dev mode without keys, redirect back to login with friendly explanatory notice
    return res.redirect(
      `${env.CLIENT_URL}/login?oauth_info=Google OAuth is ready! Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to activate live Google login.`
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);

  res.redirect(googleUrl.toString());
};

/**
 * Google OAuth Callback
 * Route: GET /api/v1/auth/oauth/google/callback
 */
export const googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/auth/oauth/google/callback`;

    if (!code) {
      return res.redirect(`${env.CLIENT_URL}/login?error=Google authentication cancelled.`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(`${env.CLIENT_URL}/login?error=Failed to retrieve Google access token.`);
    }

    // Fetch user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    if (!profile.email) {
      return res.redirect(`${env.CLIENT_URL}/login?error=No email associated with Google account.`);
    }

    // Find or create user
    let user = await User.findOne({ email: profile.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        password: crypto.randomBytes(32).toString('hex'),
        isEmailVerified: true,
        role: ROLES.USER,
      });
    }

    // Issue tokens
    const permissions = await getUserEffectivePermissions(user);
    const accessToken = generateAccessToken(user, permissions);
    const { rawToken } = await createRefreshToken(
      user._id,
      null,
      req.get('user-agent'),
      req.ip
    );

    // Set secure cookie
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, rawToken, {
      httpOnly: true,
      secure: env.IS_PROD,
      sameSite: 'lax',
      maxAge: env.JWT.REFRESH_DAYS * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${env.CLIENT_URL}/dashboard?oauth_success=true`);
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate GitHub OAuth
 * Route: GET /api/v1/auth/oauth/github
 */
export const githubAuth = (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/auth/oauth/github/callback`;

  if (!GITHUB_CLIENT_ID) {
    return res.redirect(
      `${env.CLIENT_URL}/login?oauth_info=GitHub OAuth is ready! Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env to activate live GitHub login.`
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  githubUrl.searchParams.set('redirect_uri', redirectUri);
  githubUrl.searchParams.set('scope', 'user:email');
  githubUrl.searchParams.set('state', state);

  res.redirect(githubUrl.toString());
};

/**
 * GitHub OAuth Callback
 * Route: GET /api/v1/auth/oauth/github/callback
 */
export const githubCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${env.CLIENT_URL}/login?error=GitHub authentication cancelled.`);
    }

    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(`${env.CLIENT_URL}/login?error=Failed to retrieve GitHub access token.`);
    }

    // Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Developer-Backpack',
      },
    });
    const profile = await userRes.json();

    // Fetch primary verified email if not public in profile
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Developer-Backpack',
        },
      });
      const emails = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary ? primary.email : emails[0]?.email;
    }

    if (!email) {
      return res.redirect(`${env.CLIENT_URL}/login?error=No verified email associated with GitHub account.`);
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.login,
        email: email.toLowerCase(),
        password: crypto.randomBytes(32).toString('hex'),
        isEmailVerified: true,
        role: ROLES.USER,
      });
    }

    // Issue tokens
    const permissions = await getUserEffectivePermissions(user);
    const accessToken = generateAccessToken(user, permissions);
    const { rawToken } = await createRefreshToken(
      user._id,
      null,
      req.get('user-agent'),
      req.ip
    );

    // Set secure cookie
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, rawToken, {
      httpOnly: true,
      secure: env.IS_PROD,
      sameSite: 'lax',
      maxAge: env.JWT.REFRESH_DAYS * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${env.CLIENT_URL}/dashboard?oauth_success=true`);
  } catch (error) {
    next(error);
  }
};
