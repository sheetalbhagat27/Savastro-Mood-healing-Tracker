# Savastro – Mood & Healing Tracker (MERN Stack Architecture)

A production-ready MERN stack web application with a separated **React (Vite) frontend** and **Node.js / Express.js backend**, powered by **MongoDB Atlas** with Mongoose and an enterprise-grade transactional **Nodemailer email system**.

---

## 1. Project Overview & Architecture

```
sovastro-simple/app/
├── frontend/                     # Standalone React.js (Vite) Application (Vercel)
│   ├── public/                   # Static public assets
│   ├── src/
│   │   ├── components/           # Svg Mood Trend Chart, Activity Popup, etc.
│   │   ├── pages/                # Login/Register, Today's Mood, Report, Tasks, Guides
│   │   ├── services/             # Centralized API service with JWT authentication
│   │   ├── App.jsx               # Main layout, sidebar navigation, activity reminders
│   │   ├── index.css             # Savastro design system (colors, glassmorphism, fonts)
│   │   └── main.jsx              # Application bootstrap & router
│   ├── .env.example              # Frontend environment configuration template
│   ├── package.json              # Frontend dependencies
│   ├── vercel.json               # SPA client-side routing rewrites for Vercel
│   └── vite.config.js            # Vite configuration with local proxy
│
├── backend/                      # Standalone Node.js & Express API (Render / Node host)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # MongoDB Atlas connection manager (Mongoose)
│   │   │   └── email.js          # Nodemailer SMTP transporter & verification
│   │   ├── controllers/
│   │   │   ├── authController.js # Register, login, verification, password reset, getMe
│   │   │   ├── moodController.js # Daily check-in, trends, weekly/monthly reports
│   │   │   ├── activityController.js # Astrologer remedies, counter, reminders
│   │   │   └── guideController.js    # Vetted spiritual healers & astrologers
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT Bearer authentication verification
│   │   │   ├── rateLimiter.js    # Sliding window brute-force rate limiters
│   │   │   └── errorHandler.js   # Centralized error handler (no stack trace leak)
│   │   ├── models/
│   │   │   ├── User.js           # Mongoose User schema (bcrypt hashing, verification)
│   │   │   ├── Mood.js           # Mongoose Mood schema (compound index: user + date)
│   │   │   ├── Activity.js       # Mongoose Activity schema (remedies & progress)
│   │   │   ├── Pro.js            # Mongoose Pro schema (astrologer seed data)
│   │   │   └── store.js          # Repository adapter: MongoDB Atlas in prod, in-memory for tests
│   │   ├── routes/               # Modular Express API routers
│   │   ├── services/
│   │   │   └── emailService.js   # High-priority non-blocking email dispatcher
│   │   ├── templates/            # Responsive HTML & plain-text email templates
│   │   │   ├── baseEmailTemplate.js      # Savastro navy/purple branded email shell
│   │   │   ├── verificationEmail.js      # Account activation email template
│   │   │   ├── welcomeEmail.js           # Welcome to healing journey email template
│   │   │   ├── loginNotificationEmail.js # Security sign-in alert email template
│   │   │   └── passwordResetEmail.js     # Expiring password reset email template
│   │   ├── utils/
│   │   │   └── tokens.js         # JWT signing/verifying & cryptographic token hashing
│   │   └── server.js             # Express app setup, CORS, security headers, health endpoint
│   ├── test/
│   │   └── backend.test.js       # Complete 13-scenario automated test suite
│   ├── .env.example              # Backend environment configuration template
│   └── package.json              # Backend dependencies & test scripts
│
├── vercel.json                   # Root deployment fallback for Vercel
├── package.json                  # Root runner scripts (concurrently dev, test, build)
└── README.md                     # Comprehensive architecture and operations manual
```

---

## 2. Root Cause of the Original Vercel 404 Login Error

1. **Missing Backend on Vercel**: The initial project only built the static frontend (`dist/`) on Vercel without deploying the Node.js Express server (`server/server.js`).
2. **Plain-Text HTML 404 Response**: When the frontend sent an HTTP POST to `/api/login`, Vercel responded with its default 404 HTML/text page: `"The page could not be found"`.
3. **SyntaxError Crash**: The frontend called `await res.json()` directly on the 404 HTML response, which triggered the fatal JavaScript exception:
   ```
   SyntaxError: Unexpected token 'T', "The page c..." is not valid JSON
   ```
4. **Resolution**:
   - The frontend API client (`frontend/src/services/api.js`) now uses `VITE_API_URL` to route requests to the deployed backend server.
   - Non-JSON / error responses are safely inspected and parsed, returning clean error messages instead of crashing with unhandled JSON parsing syntax errors.
   - All backend unknown routes return structured JSON (`{ "message": "Endpoint not found" }`) with a 404 status.

---

## 3. Prerequisites

- **Node.js**: `v18.0.0` or higher (tested with `v20.x`)
- **npm**: `v9.0.0` or higher
- **MongoDB Atlas**: Free M0 cluster or self-hosted MongoDB instance (`v5.0+`)
- **SMTP Provider**: Any standard SMTP provider (Gmail App Password, Brevo, SendGrid, Amazon SES, or Mailtrap for testing)

---

## 4. Local Installation & Setup

### Option A: Quick Monorepo Start (From Root)

Install all dependencies across root, backend, and frontend with a single command:
```bash
npm run install:all
```

Run both backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Run all automated unit and integration tests:
```bash
npm test
```

Build the production frontend bundle:
```bash
npm run build
```

---

### Option B: Running Independently

#### 1. Backend Setup
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env
```

Configure `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas URI (leave blank for offline memory mode during local tests)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/savastro?retryWrites=true&w=majority

# JWT Authentication Secret
JWT_SECRET=super_secret_savastro_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d

# Transactional Email System (Nodemailer)
EMAIL_FROM=Savastro <noreply@savastro.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_VERIFICATION_REQUIRED=false
SEND_LOGIN_NOTIFICATION=true
```

Start the backend API server:
```bash
npm run dev
# Server will listen at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

Run backend test suite:
```bash
npm test
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Copy environment template
cp .env.example .env
```

Configure `frontend/.env`:
```env
# Point to your local Express backend
VITE_API_URL=http://localhost:5000/api
```

Start Vite development server:
```bash
npm run dev
# Vite runs at http://localhost:5173
```

---

## 5. MongoDB Atlas Setup Guide

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Sandbox** cluster named `SavastroCluster`.
3. In **Database Access**:
   - Add a database user (e.g. `savastro_admin`) with **Read and write to any database** privileges.
   - Choose **Password** authentication and save the password securely.
4. In **Network Access**:
   - Click **Add IP Address**.
   - For cloud platforms with dynamic IPs (Render, Railway, Heroku), add `0.0.0.0/0` (Allow Access from Anywhere) or the specific static outbound IPs of your hosting provider.
5. In **Database** -> **Connect**:
   - Choose **Drivers** -> **Node.js**.
   - Copy the connection string:
     ```
     mongodb+srv://savastro_admin:<password>@savastrocluster.mongodb.net/savastro?retryWrites=true&w=majority
     ```
   - Paste this into `MONGO_URI` in your backend environment variables.

---

## 6. Email System & Nodemailer Configuration

The backend features a fully responsive, dark navy (`#0f131d`) and violet (`#7c4dff`) branded email notification suite:

| Email Template | Trigger | Action / Content |
| :--- | :--- | :--- |
| **Email Verification** | User registration / resend link | 24-hour cryptographic single-use activation link |
| **Welcome Email** | Account activation / registration | Healing journey features overview and dashboard link |
| **Login Notification** | Successful user login | Security alert with timestamp, IP, and device info |
| **Password Reset** | Forgot password request | 60-minute cryptographic single-use reset link |

### Testing with Mailtrap or Ethereal (Development)
If you don't have a production SMTP account, you can test with [Mailtrap](https://mailtrap.io):
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
```

### Gmail Configuration
1. Go to your Google Account -> **Security** -> Enable **2-Step Verification**.
2. Search for **App Passwords**.
3. Create an app password for "Savastro Backend".
4. Use `smtp.gmail.com`, port `587`, and the 16-character generated app password in `SMTP_PASS`.

> **Note on Email Graceful Degradation**: If SMTP credentials are not configured, the backend logs the email content and verification link directly to the console (`[EmailService Simulated]`) without failing or blocking authentication requests.

---

## 7. Production Deployment Guide

### Deploy Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New Web Service**.
2. Connect your Git repository (`savastro-simple`).
3. Set the following service settings:
   - **Name**: `savastro-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node src/server.js`)
4. Add the **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/savastro?retryWrites=true&w=majority
   JWT_SECRET=production_jwt_secret_64_characters_random
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://savastro-mood-healing-tracker-egjn.vercel.app
   EMAIL_FROM=Savastro <noreply@savastro.com>
   SMTP_HOST=your-smtp-host.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   EMAIL_VERIFICATION_REQUIRED=false
   SEND_LOGIN_NOTIFICATION=true
   ```
5. Click **Create Web Service**.
6. When deployment finishes, copy your Render URL (e.g. `https://savastro-backend.onrender.com`).
7. Verify by opening `https://savastro-backend.onrender.com/api/health` in your browser. You should receive:
   ```json
   {
     "status": "ok",
     "service": "savastro-backend",
     "timestamp": "2026-11-02T..."
   }
   ```

---

### Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/) and navigate to your project (`savastro-mood-healing-tracker-egjn`).
2. Go to **Settings** -> **General**:
   - **Root Directory**: Set to `frontend` (or leave as root if using the root `vercel.json` and build scripts).
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Go to **Settings** -> **Environment Variables**:
   - Add `VITE_API_URL`:
     ```
     https://savastro-backend.onrender.com/api
     ```
4. Trigger a **Redeploy** in the **Deployments** tab.
5. Your live frontend will now communicate directly with your Render Express backend and MongoDB Atlas!

---

## 8. API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new user (`{ name, email, password }`).
- `POST /api/auth/login`: Authenticate user and receive JWT (`{ email, password }`).
- `GET  /api/auth/verify-email?token=...&email=...`: Confirm user email address.
- `POST /api/auth/resend-verification`: Resend verification email (rate-limited).
- `POST /api/auth/forgot-password`: Send password reset email with secure token.
- `POST /api/auth/reset-password`: Set new password with valid token.
- `GET  /api/auth/me`: Retrieve currently authenticated user profile (Protected).

### Mood Tracking (`/api/mood`)
- `GET  /api/mood/today`: Fetch today's logged mood entry (Protected).
- `POST /api/mood`: Record or update today's mood (`{ mood, note }`) (Protected).
- `GET  /api/mood/report?range=weekly|monthly`: Aggregate trends, counts, and best/lowest days (Protected).
- `POST /api/mood/populate-demo`: Seed demo mood entries for weekly/monthly visualizations (Protected).

### Remedies & Tasks (`/api/activities`)
- `GET  /api/activities`: Retrieve user's assigned healing activities (Protected).
- `POST /api/activities`: Create a new remedy or task (Protected).
- `PATCH /api/activities/:id/progress`: Update chanting counter or timer progress (Protected).
- `PATCH /api/activities/:id/complete`: Mark remedy as completed (Protected).
- `PATCH /api/activities/:id/postpone`: Snooze remedy reminder (Protected).
- `GET  /api/activities/notification`: Poll pending reminder alerts (Protected).

### Guides & Astrologers (`/api/pros`)
- `GET  /api/pros`: List certified guides and healing professionals.

### System Health (`/api/health`)
- `GET  /api/health`: Check service status, uptime, and database connection.

---

## 9. Troubleshooting Common Issues

### Issue 1: CORS Error in Browser Console
- **Symptom**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`.
- **Fix**: In your backend hosting dashboard (e.g. Render), ensure `FRONTEND_URL` exactly matches your Vercel URL (e.g. `https://savastro-mood-healing-tracker-egjn.vercel.app`) without trailing slashes.

### Issue 2: MongoDB Connection Timed Out (`MongooseServerSelectionError`)
- **Symptom**: `MongoServerSelectionError: connection timed out`.
- **Fix**: Open MongoDB Atlas -> **Network Access** -> Ensure `0.0.0.0/0` is listed and active. Also check that your database user has correct credentials and read/write privileges.

### Issue 3: Page Refresh on Vercel Returns 404
- **Symptom**: Refreshing `/mood` or `/report` on Vercel yields a 404.
- **Fix**: Ensure `frontend/vercel.json` is deployed with rewrite rule `[{ "source": "/(.*)", "destination": "/index.html" }]`.

### Issue 4: Email Delivery Fails or Times Out
- **Symptom**: Error in backend logs: `Invalid login: 535-5.7.8 Username and Password not accepted`.
- **Fix**: For Gmail, you must use an **App Password** (16 characters), not your regular personal account password. Ensure `SMTP_SECURE=false` for port 587 or `SMTP_SECURE=true` for port 465.
