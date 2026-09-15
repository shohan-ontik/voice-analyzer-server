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

## Run with Docker (e.g. on a new machine)

```bash
cp .env.example .env      # then fill in JWT_SECRET and SEED_ADMIN_PASSWORD
docker compose up -d --build
```

This starts Postgres and the API together. On first boot the app container
runs migrations and seeds the initial admin automatically (both are
idempotent, so this is safe on every restart too). The API is then available
at `http://localhost:4000` (or whatever `PORT` is set to in `.env`).

Uploaded files persist in the `voice_analyzer_uploads` volume and Postgres
data in `voice_analyzer_pg_data` — both survive `docker compose down` (add
`-v` to that command to wipe them).

## Scripts

- `npm run dev` — start with hot reload (tsx watch)
- `npm run build` / `npm start` — compile to `dist/` and run it
- `npm run migrate` / `npm run migrate:undo` — Sequelize migrations
- `npm run seed` — run seeders (idempotent; safe to re-run)

## API

Base path: `/api/v1`. Full interactive docs (Swagger UI): start the server
and open `http://localhost:4000/api/v1/docs`. Raw OpenAPI document:
`GET /api/v1/openapi.json` (hand-maintained at `src/docs/openapi.ts` —
update it alongside any route/validator/service change).

Auth: `Authorization: Bearer <token>` from `POST /auth/login`. No
self-signup — accounts are created by an admin via `POST /admin/users`,
which returns a one-time temporary password.
