PoolUp Backend (Postgres)

Overview
- Express API backed by Postgres.
- Designed to be reachable from Expo on a real device (LAN).
- Schema initializes automatically on start (`src/db/schema.sql`).

Prerequisites
- Node 18+
- npm 9+
- Postgres (Docker recommended) or a hosted Postgres (e.g., Supabase)

1) Configure Environment
- Copy `.env.example` to `.env` and adjust as needed:
  - `PORT=3001`               # matches Expo mobile config
  - `DATABASE_URL=postgres://poolup:poolup@localhost:5432/poolup`
  - `DATABASE_SSL=false`      # set `true` for hosted Postgres like Supabase
  - `JWT_SECRET=dev-secret-change-me`

2) Start Postgres
- Option A: Local via Docker (recommended)
  - `npm run db:up`           # starts Postgres 16 on localhost:5432
  - `npm run db:logs`         # optional: tail DB logs
- Option B: Hosted Postgres (Supabase, RDS, etc.)
  - Set `DATABASE_URL` to your provider connection string
  - Set `DATABASE_SSL=true`

3) Install and Run the API
- `npm install`
- `npm run dev`               # auto-reload with nodemon
  - Server logs: "PoolUp backend listening on http://localhost:<port>"
  - If the chosen port is busy, it auto-increments (3001→3002...).

4) Verify
- Health: `curl http://localhost:3001/health` → `{ "ok": true }`
- From your phone (same Wi‑Fi): `http://<your-lan-ip>:3001/health`

Expo Mobile Notes
- Use Expo “LAN” mode; phone and laptop on the same network.
- Backend binds to `0.0.0.0` so it’s reachable at `http://<your-lan-ip>:3001`.
- The app can auto-detect nearby ports 3000–3003, but 3001 is preferred.

Key Endpoints (used by the app)
- Auth: `POST /auth/sync`, `/auth/signup`, `/auth/login`, `/auth/guest`
- Pools: `GET/POST /api/pools`, `GET /api/pools/:id`, `GET /api/pools/:id/leaderboard`
- Settings: `GET/PUT /api/pools/:id/penalty-settings`, `GET/PUT /api/pools/:poolId/users/:userId/recurring`
- Messages: `GET /api/pools/:poolId/messages`, `GET /api/messages/:poolId`, `POST /api/messages`
- Users: `GET /api/users/:id/profile`, `/streak`, `/privacy`, `POST /push-token`, `POST /notification-preferences`, `/follows`, `/feed`, `/friends-feed`, `/users/:id/pools`
- Contributions: `POST /api/contributions`
- Cards: `POST/GET /api/users/:userId/debit-card`, `POST /api/debit-card/:cardId/transaction`, `GET /api/users/:userId/card-transactions`, `PATCH /api/debit-card/:cardId/toggle`
- Banking stubs: `/api/plaid/*`, `/api/stripe/*`, `/api/payments/*`

Troubleshooting
- Port in use: free port 3001 or use the port printed in logs (auto-increment enabled).
- DB connect issues: verify `DATABASE_URL`; set `DATABASE_SSL=true` for hosted DBs.
- CORS: Open by default in `src/app.js` for development.
