# BB FlexLearn

React + Vite frontend with an Express + **MySQL** backend (login, roles, persistent data).

## Setup

```bash
npm install
cp .env.example .env        # fill in DB_* and JWT_SECRET
mysql -u root -p -e "CREATE DATABASE flexlearn CHARACTER SET utf8mb4; \
  CREATE USER 'flex'@'localhost' IDENTIFIED BY 'change-me'; GRANT ALL ON flexlearn.* TO 'flex'@'localhost';"
npm run db:seed             # creates tables (server/schema.sql) + demo data/accounts
npm run server              # API on :3001 (also creates tables on start)
npm run dev                 # frontend on :3000, proxies /api to :3001
```

Demo accounts (after `db:seed`) use the password `flexlearn123`, or `SEED_PASSWORD` if set
(required when `NODE_ENV=production`), e.g. `admin@bbflexlearn.th`, `wichai.m@bbflexlearn.th`, `somchai@bbflexlearn.th`.

Production: `npm run build`, then `NODE_ENV=production npm run server` serves `dist/` and the API together.

## Notes
- Passwords are hashed with bcrypt; sessions are 7-day JWTs. Self-registration always creates a `student`.
- The server checks roles on every write (teachers only edit their own courses, students only their own progress/notes).
- Quiz scoring and certificate issuing still run in the browser; moving them server-side is the next hardening step.
