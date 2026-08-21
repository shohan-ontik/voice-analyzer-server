# voice-analyzer-api

Express + Sequelize + PostgreSQL backend for the voice-analyzer product.
Single source of truth and auth provider for the `voice-analyzer` practice
app and the `voice-analyzer-admin` admin panel.

## Local development

```bash
cp .env.example .env      # then fill in JWT_SECRET and SEED_ADMIN_PASSWORD
npm install
docker compose up -d       # starts Postgres on localhost:5432
npm run migrate
npm run seed                # creates the first admin from SEED_ADMIN_* env vars
npm run dev                 # http://localhost:4000
```

## Scripts

- `npm run dev` — start with hot reload (tsx watch)
- `npm run build` / `npm start` — compile to `dist/` and run it
- `npm run migrate` / `npm run migrate:undo` — Sequelize migrations
- `npm run seed` — run seeders (idempotent; safe to re-run)

## API

Base path: `/api/v1`. See `../voice-analyzer/.claude` plan or `src/routes/`
for the full endpoint list: `POST /auth/login`, `GET /auth/me`,
`PATCH /auth/me/password`, `POST|GET /admin/users`,
`POST /admin/users/:id/ban`, `POST /admin/users/:id/unban`,
`POST|GET /practice-sessions`, `GET /practice-sessions/:id`,
`GET /practice-sessions/stats/summary`.

Auth: `Authorization: Bearer <token>` from `POST /auth/login`. No
self-signup — accounts are created by an admin via `POST /admin/users`,
which returns a one-time temporary password.
