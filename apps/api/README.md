# @rd-portal/api

NestJS API for the RD Portal. Clean `core/` (infra) + `modules/` (features) layout.

## Scripts

- `pnpm dev` — run the API in watch mode
- `pnpm build` — build to `dist/`
- `pnpm start` — run the built API
- `pnpm lint` — lint `src/`
- `pnpm test:e2e` — run the end-to-end test suite (see below)

## End-to-end tests

The e2e suite runs the real NestJS app against a real Postgres. No mocks.

### Prerequisites

1. Postgres running. From the repo root:

   ```bash
   docker compose -f docker-compose.yml up -d postgres
   ```

2. Schema applied:

   ```bash
   pnpm --filter @rd-portal/api exec prisma migrate deploy
   ```

   `apps/api/.env` must point at the target database (local dev default:
   `postgresql://rdportal:rdportal@localhost:55432/rdportal_dev?schema=public`).
   In CI, `DATABASE_URL` is set by the workflow to `rdportal_ci` on port 5432.

### Run

```bash
pnpm --filter @rd-portal/api test:e2e
```

### What's covered

- **Health** — liveness (`GET /health`) and readiness (`GET /health/ready`)
- **Leads** — happy path, validation failures (missing fields, bad email,
  unknown props), HTML sanitization on `name`/`message`, and the per-route
  throttling limit (5 req / 60s) on `POST /leads`

Each test builds a fresh Nest app so the in-memory throttler store stays
isolated. Every run truncates the `Lead` table before the test body runs.
