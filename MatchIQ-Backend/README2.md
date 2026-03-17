# MatchIQ — Smart Connections for Developers

> AI-assisted recruitment platform that automatically matches developers with job offers based on skills, experience, and English level.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Overview

MatchIQ connects companies with developer talent through an automated matching engine. Companies post job offers; the system scores every candidate against each offer using a weighted algorithm (skills 50%, English level 25%, experience 25%). The top 3 matches are then evaluated by an AI model that provides a recruiter-style insight for each candidate.

Three roles exist: **admin**, **company**, and **candidate**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Supabase) |
| Authentication | JWT (httpOnly cookies), Google OAuth 2.0, OTP via SendGrid |
| AI Evaluation | OpenAI API (gpt-4o-mini) |
| Email | SendGrid |
| Notifications | n8n (webhook-based) |
| Frontend | Vanilla JS, HTML, CSS |
| Backend Hosting | Railway |
| Frontend Hosting | Netlify |

---

## Architecture

```
matchiq-frontend/          matchiq-backend/
├── public/                ├── src/
│   ├── login.html         │   ├── modules/
│   ├── registerCandidate  │   │   ├── auth/
│   ├── registerCompany    │   │   ├── candidate/
│   ├── verifyEmail.html   │   │   ├── company/
│   ├── admin/             │   │   ├── offers/
│   ├── candidate/         │   │   ├── catalog/
│   └── company/           │   │   ├── matching/
└── src/                   │   │   ├── admin/
    ├── api/               │   │   ├── ai/
    ├── pages/             │   │   └── tests/
    └── styles/            │   ├── config/
                           │   ├── middlewares/
                           │   └── utils/
```

---

## Features

- **Automated matching** — PostgreSQL function scores all candidates against a job offer the moment it is created.
- **AI insights** — OpenAI evaluates the top 3 matches and returns strengths, risks, and a recommendation label.
- **Google OAuth** — candidates and companies can sign up and log in with Google. No email verification required for OAuth users.
- **Email OTP verification** — every new user registered with email/password must verify their account before logging in.
- **Password recovery** — secure time-limited reset link sent by email.
- **Role-based access** — middleware guards every route by role (admin / company / candidate).
- **Admin dashboard** — manage users, view platform stats, activate or deactivate accounts.

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A Supabase project with the required schema (see `/db` folder or contact the team)
- A SendGrid account with a verified sender
- A Google Cloud project with OAuth 2.0 credentials

### 1. Clone the repositories

```bash
git clone https://github.com/your-org/matchiq-backend.git
git clone https://github.com/your-org/matchiq-frontend.git
```

### 2. Install backend dependencies

```bash
cd matchiq-backend
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for the full list.

### 4. Run the backend

```bash
npm run dev
```

The server starts on `http://localhost:3005`.

### 5. Run the frontend

Open the `matchiq-frontend` folder in VS Code and click **Go Live** (Live Server extension). Make sure it runs on port `5500`.

> **Important:** always use `localhost`, never `127.0.0.1`. The cookie authentication depends on this.

---

## Environment Variables

Create a `.env` file in the root of `matchiq-backend` with the following variables:

```env
# Server
PORT=3005
NODE_ENV=development

# Database (Supabase)
DB_HOST=
DB_PORT=5432
DB_NAME=postgres
DB_USER=
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# Admin credentials (no DB record — env only)
ADMIN_EMAIL=admin@matchiq.com
ADMIN_PASSWORD=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3005/auth/google/callback

# SendGrid
SENDGRID_API_KEY=

# OpenAI
OPENAI_API_KEY=
AI_MODEL=gpt-4o-mini

# n8n
N8N_WEBHOOK_URL=

# CORS
ALLOWED_ORIGINS=http://localhost:5500,http://localhost:5501
ALLOWED_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:5500
```

---

## API Reference

All endpoints are prefixed with the base URL. Authenticated routes require a valid `token` cookie.

| Method  | Endpoint                            | Auth                  | Description |

| POST    | `/auth/register/candidate`          | Public                | Register a candidate |
| POST    | `/auth/register/company`            | Public                | Register a company |
| POST    | `/auth/login`                       | Public                | Login with email and password |
| POST    | `/auth/logout`                      | Any                   | Logout and clear cookie |
| GET     | `/auth/me`                          | Public                | Check current session |
| POST    | `/auth/forgotPassword`              | Public                | Request password reset link |
| POST    | `/auth/resetPassword`               | Public                | Reset password with token |
| POST    | `/auth/verifyEmail`                 | Public                | Verify OTP code |
| POST    | `/auth/resendVerificationCode`      | Public                | Resend OTP code |
| GET     | `/auth/google`                      | Public                | Start Google OAuth flow |
| GET     | `/candidate/profile`                | Candidate             | Get candidate profile |
| PATCH   | `/candidate/profile`                | Candidate             | Update candidate profile |
| PUT     | `/candidate/categories`             | Candidate             | Update candidate categories |
| PUT     | `/candidate/skills`                 | Candidate             | Update candidate skills |
| GET     | `/catalog/categories`               | Any                   | List all categories |
| GET     | `/catalog/categories/:id/skills`    | Any                   | List skills by category |
| POST    | `/offers`                           | Company               | Create a job offer |
| GET     | `/offers`                           | Company               | List company offers |
| PATCH   | `/offers/:id/status`                | Company               | Update offer status |
| GET     | `/matching/job-offers/:offerId/matches` |  Company/Admin    | Run matching for an offer |
| POST    | `/matching/job-offers/:offerId/candidates/:candidateId/notify` |  Company | Notify a candidate |
| GET     | `/admin/dashboard`                  | Admin                 | Platform stats |
| GET     | `/admin/candidates`                 | Admin                 | List all candidates |
| GET     | `/admin/companies`                  | Admin                 | List all companies |
| PATCH   | `/admin/users/:id/status`           | Admin                 | Activate or deactivate a user |

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | Railway  | Set all env variables in the Railway dashboard. Do not set `PORT` manually — Railway assigns it automatically. |
| Frontend | Netlify | Publish directory: `.` — root. A `netlify.toml` handles routing to `/public`. |

### Production environment variables to update

When deploying, make sure these point to the live URLs:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.netlify.app
FRONTEND_URL=https://your-frontend.netlify.app
GOOGLE_CALLBACK_URL=https://your-backend.up.railway.app/auth/google/callback
```

Also update `DEFAULT_BASE_URL` in `src/api/apiClient.js` on the frontend:

```javascript
const DEFAULT_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:3005"
  : "https://your-backend.up.railway.app";
```

---

> Built with passion by the MatchIQ team.