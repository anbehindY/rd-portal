# 🏟️ Request Demo Portal

> Monorepo for the RD Portal — a **Next.js** marketing/landing surface and a **NestJS** API backed by **Postgres**.

---

## 📑 Table of contents

- [🏗️ Architecture](#️-architecture)
- [✅ How the brief is addressed](#-how-the-brief-is-addressed)
  - [🔒 Validation & Security](#-validation--security)
  - [🎨 UI/UX](#-uiux)
  - [⚡ Performance](#-performance)
  - [🧪 Testing](#-testing)
  - [🚀 CI/CD](#-cicd)
- [🛠️ Prerequisites](#️-prerequisites)
- [▶️ Run it locally](#️-run-it-locally)
- [🔍 Verifying a lead submission](#-verifying-a-lead-submission)
- [📜 Useful commands](#-useful-commands)
- [🌱 Environment](#-environment)
- [🤖 CI pipeline](#-ci-pipeline)
- [📁 Repo layout](#-repo-layout)

---

## 🏗️ Architecture

**Monorepo (pnpm workspaces + Turborepo).** Two apps share one lockfile and one task graph. Turbo handles caching and parallel `dev`/`build`/`lint`/`test`.

### 🌐 [apps/web](apps/web) — Next.js 16 + React 19 + Tailwind v4

App Router, server components by default, client components only where interactivity needs them (e.g. the lead form). Talks to the API over HTTP — no shared DB access.

### ⚙️ [apps/api](apps/api) — NestJS 10 (Express)

Split into:

- **`core/`** — cross-cutting infra
  - typed env validation ([env.validation.ts](apps/api/src/core/config/env.validation.ts))
  - Prisma database module
  - Pino structured logging
  - global throttler
  - HTML sanitization
  - exception filter
- **`modules/`** — feature slices
  - `health` — liveness/readiness
  - `leads` — demo request intake

**🛡️ Hardening in [main.ts](apps/api/src/main.ts):** Helmet, 100kb JSON body cap, whitelist+`forbidNonWhitelisted` validation pipe, origin-locked CORS with `credentials: false` (stateless API — no cookies, so CSRF is out of scope until auth is added).

### 🗄️ Postgres 16 via Prisma

Schema in [schema.prisma](apps/api/prisma/schema.prisma); migrations checked in under [apps/api/prisma/migrations](apps/api/prisma/migrations). The API is the only service that touches the DB.

### 🤝 Why these choices

| Choice                             | Reason                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 🔀 **Separate web and api**        | Public surface (SSR, SEO, static) stays independent of the transactional API. Either can scale or redeploy on its own. |
| 📦 **Prisma + migrations in-repo** | Schema changes are reviewable and keep local/CI/prod in lockstep.                                                      |
| 🪶 **Stateless API, CORS-locked**  | Simplest secure default for a browser-submitted form. No sessions, no CSRF tokens needed.                              |
| ⚡ **Turbo**                       | Skips rebuild/retest for packages that didn't change — matters most in CI.                                             |

---

## ✅ How the brief is addressed

### 🔒 Validation & Security

**Two-layer schema validation** — client validates for UX, server validates for trust.

- 🖥️ **Client** — [Zod](https://zod.dev) schema + `react-hook-form` via `@hookform/resolvers/zod` in [DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx). Inline field errors, no request fires until the form is valid.
- 🖧 **Server** — `class-validator` DTO ([create-lead.dto.ts](apps/api/src/modules/leads/dto/create-lead.dto.ts)) with `@IsEmail`, `@IsISO31661Alpha2`, `@Length`, plus a global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) in [main.ts](apps/api/src/main.ts) that rejects any payload with unknown properties. Client validation is never trusted; the API re-validates everything.

**🧼 XSS** — User-supplied `name` and `message` are stripped of all HTML via `sanitize-html` before hitting the DB ([sanitize.ts](apps/api/src/core/security/sanitize.ts), applied as a `class-transformer` `@Transform` on the DTO). Helmet sets `X-Content-Type-Options`, `X-Frame-Options`, a restrictive CSP, and related headers on every response. React escapes interpolated values by default, so rendering of any future server-returned content is safe too.

**🛡️ CSRF** — The API is deliberately stateless (no cookies, no sessions) and CORS is origin-locked to `CORS_ORIGIN` with `credentials: false`. Without ambient credentials, a cross-site `POST` can't be authenticated on behalf of a user, which neutralises classic CSRF. The rationale is documented inline in [main.ts](apps/api/src/main.ts); if auth cookies are added later, a CSRF token layer (e.g. double-submit cookie) plugs in at that same boundary.

**🚦 Rate-limiting (form spam)** — `@nestjs/throttler` is wired as a global guard ([throttler.module.ts](apps/api/src/core/throttler/throttler.module.ts)) with a **10 req/min** default, and `POST /leads` tightens that to **5 req/min per IP** ([leads.controller.ts](apps/api/src/modules/leads/leads.controller.ts)). Combined with the 100kb JSON body cap in [main.ts](apps/api/src/main.ts), this shuts down casual form-spam without needing a captcha.

**📝 Structured logging with redaction** — `nestjs-pino` in [logger.module.ts](apps/api/src/core/logger/logger.module.ts) with `pino-http` gives one log line per request — pretty-printed in dev, JSON in prod. The `redact` config scrubs `authorization`, `cookie`, and `req.body.businessEmail` so PII never lands in logs. Useful for diagnosing throttle hits or 400s without leaking user data, and cheap to ship to any log aggregator later.

---

### 🎨 UI/UX

**📱 Responsive design** — Tailwind v4 with a mobile-first breakpoint ladder. The demo form collapses name/email into a single column on mobile and splits to two columns from `sm:` upward ([DemoForm.tsx:174](apps/web/src/components/landing/DemoForm.tsx#L174)); the category grid scales from 1 → 2 → auto columns via `sizes` hints.

**💬 Interactive feedback** — every submission state is distinct and accessible:

| State                    | What the user sees                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⚠️ Inline errors         | Per-field Zod errors render under each input ([FormField.tsx](apps/web/src/components/ui/FormField.tsx)), with `aria-describedby` wiring for screen readers |
| ⏳ Submitting            | Loading spinner on the button, all inputs disabled                                                                                                          |
| ✅ Success (201)         | Form replaced by a success panel with a "Submit another" reset                                                                                              |
| ❌ Validation fail (400) | Surfaces the server's validation messages in an `role="alert"` banner                                                                                       |
| 🚫 Throttled (429)       | "Too many requests, try again later" notice                                                                                                                 |
| 🔌 Network fail          | "Unable to reach the server" notice                                                                                                                         |

**♿ Accessibility** — Labels bound via `htmlFor`, required/optional state visible, focus rings preserved, and the country select uses Radix primitives for full keyboard + screen-reader support.

---

### ⚡ Performance

- 🖼️ **Images served as `.webp`** from [apps/web/public/images](apps/web/public/images) and rendered through `next/image`, which generates responsive `srcset`s automatically. `sizes` hints are set per usage so the browser downloads only the resolution it'll actually paint:
  - [Hero.tsx:33-34](apps/web/src/components/landing/Hero.tsx#L33-L34) — uses `priority` so the hero is preloaded and not lazy-loaded, improving **LCP**
  - [CategoryGrid.tsx:30](apps/web/src/components/landing/CategoryGrid.tsx#L30)
  - [RequestDemo.tsx:28](apps/web/src/components/landing/RequestDemo.tsx#L28)
- 🔤 **Fonts self-hosted** under [apps/web/public/fonts](apps/web/public/fonts) — no third-party DNS + TLS round trip on first paint.
- 🧩 **Server components by default** — only [DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx) opts into `"use client"`, keeping the JS bundle shipped to the browser small.
- 🏎️ **Turbo caching** in CI and locally — repeated `build`/`lint`/`test` runs skip unchanged packages.

---

### 🧪 Testing

End-to-end tests in [apps/api/test](apps/api/test) boot the real Nest app against a real Postgres — **no mocks** — because the value of these tests is proving the validation, sanitization, throttling, and DB schema all line up together. See [apps/api/README.md](apps/api/README.md) for coverage details; in short, the Leads suite exercises:

- ✅ Happy path
- ⚠️ Validation failures (missing fields, bad email, unknown props)
- 🧼 HTML sanitization on `name`/`message`
- 🚦 The 5 req/min throttle on `POST /leads`

CI runs the same suite against a fresh Postgres service container on every PR.

---

### 🚀 CI/CD

See [CI pipeline](#-ci-pipeline) below — three parallel jobs (lint, build, api-integration with real Postgres), Turbo + Next build caching, minimized permissions, concurrency cancellation per-ref.

---

## 🛠️ Prerequisites

- 🟢 **Node.js ≥ 20**
- 📦 **pnpm 9** — `corepack enable && corepack prepare pnpm@9.12.0 --activate`
- 🐳 **Docker Desktop** — for Postgres

---

## ▶️ Run it locally

```bash
# 1️⃣ Install
pnpm install

# 2️⃣ Start Postgres (exposed on host port 55432 to avoid clashing with a
#    native postgres install on 5432)
docker compose up -d postgres

# 3️⃣ Configure env
cp apps/web/.env.local.example apps/web/.env.local
# apps/api/.env is already checked in with local defaults

# 4️⃣ Apply the schema
pnpm db:migrate

# 5️⃣ Run both apps
pnpm dev
```

- 🌐 Web → http://localhost:3000
- ⚙️ API → http://localhost:3001 (health: `/health`, `/health/ready`)

---

## 🔍 Verifying a lead submission

After submitting the **"Request a Demo"** form on the landing page, reviewers can confirm the record landed in Postgres by opening Prisma Studio:

```bash
pnpm db:studio
```

It opens at http://localhost:5555 — select the **`Lead`** table to see the row, including `name`, `businessEmail`, `country`, `message` (HTML-sanitized), and `createdAt`.

---

## 📜 Useful commands

| Command                  | What it does                                                   |
| ------------------------ | -------------------------------------------------------------- |
| `pnpm dev`               | 🏃 Run web + api in watch mode (via Turbo)                     |
| `pnpm build`             | 📦 Production build of both apps                               |
| `pnpm lint`              | 🔍 Lint both apps                                              |
| `pnpm test:e2e`          | 🧪 Run the API e2e suite against local Postgres                |
| `pnpm db:migrate`        | 🗄️ Create/apply a Prisma migration                             |
| `pnpm db:studio`         | 🔎 Open Prisma Studio against the local DB                     |
| `docker compose down`    | ⏹️ Stop Postgres (data persists in the `postgres_data` volume) |
| `docker compose down -v` | 🧨 Stop Postgres **and** wipe the volume                       |

---

## 🌱 Environment

- 📄 **`apps/api/.env`** — `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`. Values are validated at boot ([env.validation.ts](apps/api/src/core/config/env.validation.ts)); the app refuses to start if anything is missing or malformed.
- 📄 **`apps/web/.env.local`** — `NEXT_PUBLIC_API_URL` points the browser at the API.

---

## 🤖 CI pipeline

Defined in [.github/workflows/ci.yml](.github/workflows/ci.yml). Runs on every push to `main` and every pull request. Concurrency is scoped per-ref with `cancel-in-progress: true`, so pushing a new commit supersedes any in-flight run on the same branch.

Three jobs run **in parallel** on `ubuntu-latest` with Node 20 + pnpm 9 (`--frozen-lockfile`):

### 1️⃣ Lint

`pnpm turbo run lint` across both apps. Turbo cache persisted via `actions/cache` keyed on commit SHA.

### 2️⃣ Build

`pnpm turbo run build`. Caches both the Turbo output and `apps/web/.next/cache` (keyed on the web app's source + lockfile hash) so unchanged Next builds stay warm across runs.

### 3️⃣ API integration

Boots a `postgres:16-alpine` service container on `localhost:5432` with DB `rdportal_ci`, runs `prisma migrate deploy`, then executes the API e2e suite (`pnpm --filter @rd-portal/api test:e2e`) against the real database.

> 🔐 Permissions are minimized to `contents: read`, and `TURBO_TELEMETRY_DISABLED` is set to keep runs offline-friendly.

---

## 📁 Repo layout

```
apps/
  api/                 ⚙️  NestJS service + Prisma schema/migrations + e2e tests
  web/                 🌐  Next.js app
docker-compose.yml     🐳  Postgres for local dev
turbo.json             ⚡  Task graph
pnpm-workspace.yaml    📦  Workspace definition
```
