# 🎒 Developer Backpack: Production-Grade Authentication & Authorization System

> **A standalone, reference-quality full-stack authentication system** engineered with **React JS (Vite + Tailwind CSS)** on the frontend and **Node.js + Express.js + MongoDB (Mongoose)** on the backend.

Built for dual purposes:
1. **Immediate Production Integration**: Drop the modular backend and/or frontend components directly into any existing software stack with minimal configuration.
2. **Educational & Reference Architecture**: Every single file features comprehensive explanatory comments, "You Are Here" architectural markers, and complete end-to-end lifecycle flow diagrams on critical paths.

---

## 🌟 Key Architecture & Feature Matrix

### 🔐 1. Authentication Lifecycle
- **User Registration**: Clean signup with input sanitization, password complexity scoring, and automatic verification email dispatch.
- **Email Verification**: Cryptographically secure 32-byte tokens hashed with SHA-256 before storage in MongoDB; accounts require email activation prior to login.
- **Credential Checking & Brute-Force Lockout**: Password verification using `bcrypt` (12 salt rounds). Tracks consecutive failed attempts and locks accounts automatically for 15 minutes after 5 failures.
- **Self-Service Password Recovery**: Secure forgot-password and reset-password flows with 1-hour expiration tokens and automatic invalidation of all other active sessions upon password modification.
- **Change Password**: Authenticated password change enforcing verification of the current password.

### 🛡️ 2. Two-Factor Authentication (2FA) — Dual Support
- **Google Authenticator (TOTP - RFC 6238)**:
  - Generates Base32 shared secret and scannable visual QR Code (`qrcode`).
  - Encrypts TOTP secrets at rest using **AES-256-GCM** (authenticated encryption with MAC tags).
  - Verifies 6-digit dynamic codes with configurable clock drift tolerance.
- **Email-Based OTP**:
  - Delivers 6-digit numeric codes directly to verified email inboxes.
  - Hashed with SHA-256 with a strict 10-minute time-to-live (TTL).
- **Multi-Step Login Challenge**:
  - If 2FA is active, login pauses after password check and issues a constrained, short-lived `mfaTicket` (5 mins).
  - Access and refresh tokens are withheld until the challenge code is verified.
- **Emergency Backup Recovery Codes**:
  - Generates 8 single-use alphanumeric recovery codes (`XXXX-XXXX`).
  - Stored as SHA-256 hashes in MongoDB; burnt immediately upon use.
  - Can be copied to clipboard or downloaded as `.txt`.

### 🔄 3. Production Token Architecture
- **Short-Lived Access Tokens**: Signed JWTs containing user ID, role, and granular permissions. Expires in **15 minutes**. Stored exclusively in client React memory (never localStorage).
- **Long-Lived Refresh Tokens**: 64-byte random tokens stored as SHA-256 hashes in MongoDB and delivered via **HTTP-only, SameSite, Secure cookies**.
- **Token Rotation**: Every `/auth/refresh` request revokes the existing refresh token and issues a fresh pair under the same lineage (`familyId`).
- **Reuse Breach Detection**: If an old or revoked refresh token is presented, the system detects a token replay attack and immediately invalidates the entire `familyId` across all devices.

### 👑 4. Dynamic Role-Based Access Control (RBAC)
- **Predefined System Roles**: `admin`, `moderator`, `user`.
- **Dynamic Custom Roles**: Administrators can create custom roles at runtime (e.g. `auditor`, `content-manager`) and assign arbitrary permission matrices.
- **Granular Permissions**: Action-based permissions (`users:read`, `users:write`, `users:delete`, `roles:manage`, `analytics:view`, etc.).
- **Middleware Guards**: Route-level enforcement via `requireRole(...)` and `requirePermission(...)`.

### 🎨 5. Modern Frontend (React + Tailwind CSS)
- **Design Research Grounded**: Clean, high-trust SaaS aesthetic inspired by Untitled UI, Stripe, and Linear.
- **Custom UI Library**:
  - Segmented 6-digit `OTPInput` with auto-focus, backspace retreat, and clipboard paste support.
  - `Button` with variants (primary, secondary, ghost, danger), sizes, and loading state spinners.
  - `Input` with prefix icons and password visibility toggling.
  - `Card` surfaces with subtle border geometry and atmospheric shadows.
  - `QRCodeDisplay`, `Badge`, `Alert`, and `Modal` dialogs.
- **Route Guards**: `ProtectedRoute`, `RoleRoute`, and `GuestRoute`.
- **Silent Refresh Interceptor**: Axios interceptor with concurrent queue to refresh expired tokens seamlessly without disrupting active user requests.

---

## 📁 Folder Structure

```plaintext
authentication/
├── README.md                      # Comprehensive system documentation
│
├── backend/                       # Node.js + Express + MongoDB Backend
│   ├── .env.example               # Detailed environment variables with descriptions
│   ├── package.json               # Backend dependencies & scripts
│   ├── server.js                  # Entry point, Express pipeline & DB lifecycle
│   └── src/
│       ├── config/
│       │   ├── constants.js       # System roles, permissions, cookie & security configs
│       │   ├── env.js             # Validated environment loader with defaults
│       │   ├── db.js              # Resilient MongoDB connector + in-memory fallback
│       │   └── mailer.js          # Nodemailer with auto-Ethereal development fallback
│       ├── models/
│       │   ├── User.js            # User profile, bcrypt hooks, 2FA & lockout fields
│       │   ├── RefreshToken.js    # Persistent tokens, family lineage & TTL index
│       │   └── Role.js            # Dynamic system and custom RBAC roles
│       ├── middleware/
│       │   ├── authMiddleware.js  # JWT Bearer token verification
│       │   ├── rbacMiddleware.js  # Role & granular permission enforcement
│       │   ├── rateLimiters.js    # Express rate limiters for login & sensitive actions
│       │   ├── validateMiddleware.js # Input sanitization & validation rules
│       │   └── errorMiddleware.js # Global error boundary & 404 handler
│       ├── services/
│       │   ├── cryptoService.js   # SHA-256 hashing, CSPRNG, AES-256-GCM encryption
│       │   ├── tokenService.js    # JWT generation, rotation, reuse breach detection
│       │   ├── twoFactorService.js# TOTP (RFC 6238), Email OTP & backup codes
│       │   └── emailService.js    # Email dispatcher & Ethereal preview logger
│       ├── templates/             # Responsive HTML email templates
│       │   ├── verifyEmail.js
│       │   ├── resetPassword.js
│       │   ├── otpCode.js
│       │   └── backupCodes.js
│       ├── controllers/           # Request handlers with lifecycle flow charts
│       │   ├── authController.js  # Signup, Verify, Login, Refresh, Logout
│       │   ├── passwordController.js # Forgot, Reset, Change Password
│       │   ├── twoFactorController.js # 2FA Setup, Verify, Challenge, Backup codes
│       │   ├── userController.js  # Profile management & admin user CRUD
│       │   └── roleController.js  # Custom role creation & permission assignment
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── twoFactorRoutes.js
│       │   ├── userRoutes.js
│       │   └── roleRoutes.js
│       └── utils/
│           ├── apiResponse.js     # Standardized JSON response envelope
│           └── logger.js          # Timestamped color console logger
│
└── frontend/                      # React JS (JavaScript) Frontend (Vite)
    ├── .env.example               # Frontend environment template
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js         # Design tokens, brand palette & shadows
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── index.css              # Tailwind imports & theme variables
        ├── main.jsx               # React DOM mount with BrowserRouter
        ├── App.jsx                # Declarative route tree & AuthProvider
        ├── constants/
        │   └── index.js           # Route paths, API endpoints, Roles, Permissions
        ├── utils/
        │   ├── helpers.js         # Clipboard copy, file download, formatting
        │   └── validators.js      # Password strength meter & email validation
        ├── api/
        │   ├── client.js          # Axios instance, memory token & silent refresh queue
        │   ├── authService.js
        │   ├── twoFactorService.js
        │   ├── userService.js
        │   └── roleService.js
        ├── context/
        │   └── AuthContext.jsx    # User identity, roles, memory token, login, logout
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useForm.js
        │   ├── useApi.js
        │   └── useTwoFactor.js
        ├── components/
        │   ├── ui/                # Reusable design system components
        │   │   ├── Button.jsx     # Variants: primary, secondary, outline, ghost, danger
        │   │   ├── Input.jsx      # Label, icons, inline errors, password reveal toggle
        │   │   ├── Card.jsx       # Auth form wrapper with header & footer slots
        │   │   ├── Alert.jsx      # Success, error, warning, info alerts
        │   │   ├── Spinner.jsx    # Accessible SVG loading indicator
        │   │   ├── OTPInput.jsx   # 6-digit segmented auto-advancing input
        │   │   ├── QRCodeDisplay.jsx # QR code viewer with copyable secret
        │   │   ├── Badge.jsx      # Role and permission pills
        │   │   └── Modal.jsx      # Accessible dialog wrapper
        │   ├── layout/
        │   │   ├── Navbar.jsx     # Responsive navigation with user info & logout
        │   │   ├── AuthLayout.jsx # Centered layout with atmospheric glow
        │   │   └── DashboardLayout.jsx
        │   └── common/
        │       ├── ProtectedRoute.jsx
        │       ├── RoleRoute.jsx
        │       └── GuestRoute.jsx
        └── pages/
            ├── auth/
            │   ├── LoginPage.jsx
            │   ├── SignUpPage.jsx
            │   ├── VerifyEmailPage.jsx
            │   ├── ForgotPasswordPage.jsx
            │   ├── ResetPasswordPage.jsx
            │   └── TwoFactorChallengePage.jsx
            ├── dashboard/
            │   └── DashboardPage.jsx # Overview, Role badge, Live Permission tester
            ├── settings/
            │   ├── SettingsPage.jsx # Profile, 2FA status, Backup codes modal
            │   ├── TwoFactorSetupPage.jsx # 3-step wizard (QR, OTP, Backup codes)
            │   └── ChangePasswordPage.jsx
            ├── admin/
            │   └── RoleManagementPage.jsx # Custom role & permission management
            ├── UnauthorizedPage.jsx # 403 Forbidden screen
            └── NotFoundPage.jsx     # 404 screen
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- **MongoDB** (Local daemon or MongoDB Atlas connection string)

---

### 1. Backend Setup

```bash
cd authentication/backend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start development server with file watching
npm run dev
```

The backend server will start on `http://localhost:5000`.

#### Development Email Preview (Zero-Setup)
If `SMTP_HOST` is left empty in `.env`, Nodemailer automatically initializes an **Ethereal test mailer** and prints clickable preview links directly in your terminal console!

---

### 2. Frontend Setup

```bash
cd authentication/frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 📡 API Endpoints Reference

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/signup` | Public | Register a new user account |
| `POST` | `/verify-email` | Public | Confirm account email via link token |
| `POST` | `/resend-verification` | Public | Resend account activation email |
| `POST` | `/login` | Public | Authenticate credentials (returns tokens or 2FA challenge) |
| `POST` | `/refresh` | Public (Cookie) | Rotate Refresh Token and receive new Access Token |
| `POST` | `/logout` | Public (Cookie) | Revoke Refresh Token in DB and clear cookie |
| `POST` | `/forgot-password` | Public | Request a 1-hour password reset link |
| `POST` | `/reset-password/:token` | Public | Set new password using reset token |
| `POST` | `/change-password` | Authenticated | Change password (verifies current password) |
| `GET` | `/me` | Authenticated | Retrieve authenticated user profile and permissions |

### Two-Factor Authentication (`/api/v1/auth/2fa`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/setup-totp` | Authenticated | Generate TOTP secret and scannable QR Code Data URL |
| `POST` | `/enable-totp` | Authenticated | Verify 6-digit code, activate TOTP, and issue backup codes |
| `POST` | `/send-email-otp` | Public / Auth | Dispatch a 6-digit numeric OTP to registered email |
| `POST` | `/enable-email` | Authenticated | Verify email OTP and activate Email 2FA |
| `POST` | `/disable` | Authenticated | Disable 2FA (requires password verification) |
| `POST` | `/verify-challenge`| Public (MFA Ticket) | Verify TOTP, Email OTP, or Backup Code on login |
| `POST` | `/backup-codes` | Authenticated | Regenerate 8 emergency recovery backup codes |

### User Administration (`/api/v1/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/me` | Authenticated | Get current user's profile |
| `PUT` | `/me` | Authenticated | Update current user's display name |
| `GET` | `/` | `users:read` | Paginated list of user accounts |
| `DELETE` | `/:id` | `users:delete` | Delete user account by ID |

### Dynamic RBAC & Roles (`/api/v1/roles`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | List all system & custom roles + available permissions |
| `POST` | `/` | `roles:manage` | Create a new custom role with selected permissions |
| `PUT` | `/:name/permissions` | `roles:manage` | Update permissions assigned to a custom role |
| `POST` | `/assign` | `roles:manage` | Assign a role to a specific user |

---

## 🛡️ Security Best Practices Implemented

1. **Memory Access Tokens**: The client never persists raw JWT access tokens in `localStorage` or `sessionStorage`, mitigating cross-site scripting (XSS) credential exfiltration.
2. **HTTP-Only Refresh Cookie**: Sent with `httpOnly: true`, `sameSite: 'lax'`, and `secure: true` (in production) to neutralize CSRF and script snooping.
3. **Automatic Token Rotation**: Every refresh produces a new token pair and revokes the predecessor.
4. **Reuse Breach Detection**: Detecting already-revoked refresh tokens triggers an immediate emergency shutdown of the entire token family lineage.
5. **AES-256-GCM Encryption**: TOTP secrets are encrypted using authenticated 256-bit encryption before hitting MongoDB.
6. **Token Hashing at Rest**: Verification tokens, password reset tokens, refresh tokens, and backup codes are all stored as SHA-256 hashes.
7. **Rate Limiting**: Brute-force protection on `/login` (5 attempts / 15m), `/auth/2fa/*` (5 attempts / 15m), and `/forgot-password` (3 attempts / 15m).
8. **Account Lockout**: 5 consecutive password failures lock the account for 15 minutes.

---

## 🔌 Integrating Into Your Own Project

### Option A: Integrate the Entire Full-Stack Solution
1. Copy `authentication/backend` to your server directory.
2. Configure `.env` with your `MONGODB_URI` and SMTP provider.
3. Copy `authentication/frontend/src/components/ui`, `src/api`, `src/context`, and `src/hooks` into your React application.
4. Wrap your app with `<AuthProvider>` and import `apiClient`.

### Option B: Use Backend Authentication Service Only
1. Copy `backend/src/` into your existing Express application.
2. Mount the routes in your Express app:
   ```javascript
   import authRoutes from './routes/authRoutes.js';
   import twoFactorRoutes from './routes/twoFactorRoutes.js';
   import { verifyAuth } from './middleware/authMiddleware.js';

   app.use('/api/v1/auth', authRoutes);
   app.use('/api/v1/auth/2fa', twoFactorRoutes);
   ```

---

## 📄 License
This module is licensed under the [MIT License](LICENSE). Free to use and modify for personal, educational, and commercial projects!
