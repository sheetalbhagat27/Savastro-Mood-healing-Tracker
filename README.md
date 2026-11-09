# Sovastro – MERN Stack (Module 2: Mood, Tasks, Guides & Remedies)

```
sovastro-mern/
├── backend/    Node + Express + MongoDB (Mongoose) REST API
└── frontend/   React (Vite) + React Router
```

## Requirements
Node.js 18+ and a MongoDB database (local or MongoDB Atlas).

## Run locally
**1. Backend**
```bash
cd backend
npm install
cp .env.example .env        # then set MONGO_URI and a long random JWT_SECRET (32+ chars)
npm run seed                # creates demo accounts + 3 guides
npm run dev                 # http://localhost:5000
```
**2. Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173  (proxies /api to the backend)
```

## Demo accounts (created by `npm run seed` – change before going live)
| Role       | Email                    | Password     |
|------------|--------------------------|--------------|
| Admin      | admin@sovastro.com       | Admin@12345  |
| Astrologer | astrologer@sovastro.com  | Astro@12345  |
| User       | user@sovastro.com        | User@12345   |

## Features
- **Public site**: landing page (same Sovastro theme), consultation request form saved to the database.
- **Auth**: register / login / logout, HttpOnly session cookie, session revocation on logout and role change.
  Public sign-up always creates a `user`; roles are changed only by an admin.
- **User**: daily mood check-in (editable for 2 hours), weekly & monthly reports (chart, average, streak),
  tasks with tap counter, guide booking & cancellation, assigned remedies.
- **Remedies**: astrologer/admin assigns remedies with timer, counter, photo proof or check-in completion,
  reminder slots, date range. Server enforces minimum timer duration, target count, one completion per
  slot per day, and per-user isolation. Photo proofs go to an astrologer review queue (approve/reject).
- **Admin**: stats, user roles, consultation requests, booking status.

## API summary (all under `/api`)
- `POST /auth/register|login|logout`, `GET /auth/me`
- `GET /moods/today`, `POST /moods`, `GET /moods/report?range=week|month`
- `GET/POST /tasks`, `PATCH /tasks/:id/progress`, `POST /tasks/:id/complete`, `DELETE /tasks/:id`
- `GET /guides`, `POST /guides/:id/book`, `GET /bookings/mine`, `DELETE /bookings/:id`
- `GET/POST /remedies`, `POST /remedies/:id/start|complete`, `GET /remedies/:id/progress`, `DELETE /remedies/:id`
- `GET /remedies/clients`, `GET /remedies/reviews/pending`, `PATCH /remedies/completions/:id/review`
- `POST /leads` (public), `GET|PATCH /admin/*` (admin only)

## Production notes
- Set `NODE_ENV=production`, `FRONTEND_URL=https://your-frontend`, a strong `JWT_SECRET`, and HTTPS on both hosts.
  For different domains keep `COOKIE_SAMESITE=none` (cookie becomes `Secure`).
- Frontend: set `VITE_API_URL=https://your-api/api` before `npm run build`, deploy `dist/`.
- Photo proofs are stored in MongoDB (max ~1 MB) for simplicity; use S3/Cloudinary for real traffic.
- Not included: voice/video proofs, push notifications while the site is closed, email verification and
  password reset (SMTP). These can be added on top of this structure.
