# PoolUp – Social Micro‑Savings (MVP)

This repo contains a minimal, runnable MVP for **PoolUp**: create group savings pools, contribute, and chat — all in a clean, modern style.

## Stack
- **Server:** Node + Express + SQLite (better-sqlite3), Socket.IO for realtime
- **Mobile App:** React Native (Expo) + React Navigation + Socket.IO client

## Quick Start

### 1) Server
```bash
cd server
cp .env.example .env
npm install
npm run dev
# server on http://localhost:4000
```

### 2) App (Expo)
```bash
cd ../app
npm install
# Tell the app where the server is running
export EXPO_PUBLIC_SERVER_URL="http://YOUR_LOCAL_IP:4000"  # e.g. http://192.168.1.10:4000
npm run start
```

- In the Expo Dev Tools, open **iOS simulator**, **Android emulator**, or scan the QR code with Expo Go.
- If testing in a simulator on the same machine, you can set `EXPO_PUBLIC_SERVER_URL="http://localhost:4000"`.

## Features implemented
- Guest sign‑in (enter name)
- Create pool (name + goal)
- See progress bar (sum of contributions vs goal)
- Contribute to pool (fake deposit recorded in DB)
- Real‑time updates (new contributions)
- Group chat per pool (real‑time)

## Notes
- Payments and bank integrations (Stripe/Plaid) are **stubbed** for this MVP. You can swap the `/contributions` endpoint to trigger real payments later.
- SQLite db file `poolup.db` is created in the server directory.
- You can inspect data with any SQLite viewer.

## Next steps
- Auth (Clerk/Supabase) and secure sessions
- Scheduled deposits & streaks
- Withdrawal rules (lock until date, consensus unlock)
- Push notifications
- Bank connections (Plaid) + real payments (Stripe)
- Nice UI components & animations
```
# PoolUp
