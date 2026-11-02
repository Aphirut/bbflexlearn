# BB FlexLearn

React + Vite frontend with a Bun + Elysia + **MySQL** backend (login, roles, persistent data).

## Setup

```bash
npm install
cp .env.example .env        # fill in DB_* and JWT_SECRET
mysql -u root -p -e "CREATE DATABASE flexlearn CHARACTER SET utf8mb4; \
  CREATE USER 'flex'@'localhost' IDENTIFIED BY 'change-me'; GRANT ALL ON flexlearn.* TO 'flex'@'localhost';"
npm run db:seed             # resets the DB and imports demo data/accounts from flexlearn.sql
npm run server              # API on :3001 (also creates tables on start)
npm run dev                 # frontend on :3000, proxies /api to :3001
```

For an empty database instead of demo data, skip `db:seed` and create the first admin with
`ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npm run db:create-admin`.

Demo accounts (after `db:seed`) all use the password `flexlearn123`:
`admin@bbflexlearn.th` (admin), `wichai.m@bbflexlearn.th` (teacher), `somchai@bbflexlearn.th` (student).
Change these passwords before any public deployment.

Production: `npm run build`, then `NODE_ENV=production npm run server` serves `dist/` and the API together.

## Notes
- Passwords are hashed with bcrypt; sessions are 7-day JWTs. Self-registration always creates a `student`.
- The server checks roles on every write (teachers only edit their own courses, students only their own progress/notes).
- Quiz scoring, watch-time verification, and certificate eligibility are enforced server-side; the browser only renders the results.
