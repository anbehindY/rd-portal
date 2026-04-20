# 🏟️ Request Demo Portal

> A **Next.js** landing page + **NestJS** API + **Postgres**, in one monorepo.

---

## 📑 Contents

- [🏗️ Architecture](#️-architecture)
- [✅ How the brief is addressed](#-how-the-brief-is-addressed)
  - [🔒 Validation & Security](#-validation--security)
  - [🎨 UI/UX](#-uiux)
  - [⚡ Performance](#-performance)
  - [🧪 Testing](#-testing)
  - [🚀 CI/CD](#-cicd)
- [🛠️ Prerequisites](#️-prerequisites)
- [▶️ Run it locally](#️-run-it-locally)
- [🔍 Check a submission](#-check-a-submission)
- [📜 Commands](#-commands)
- [🌱 Environment](#-environment)
- [🤖 CI pipeline](#-ci-pipeline)
- [📁 Repo layout](#-repo-layout)

---

## 🏗️ Architecture

Two apps. One lockfile. **pnpm workspaces + Turborepo** for caching and parallel tasks.

### 🌐 [apps/web](apps/web) — Next.js 16 + React 19 + Tailwind v4

The public landing page. Server components by default. Only the form is a client component. Talks to the API over HTTP.

### ⚙️ [apps/api](apps/api) — NestJS 10

- **`core/`** — shared infra: env validation, Prisma, Pino logger, throttler, HTML sanitizer, exception filter.
- **`modules/`** — features: `health` and `leads`.

**🛡️ Hardening in [main.ts](apps/api/src/main.ts):** Helmet, 100kb body cap, strict validation pipe, CORS locked to the web origin, no cookies.

### 🗄️ Postgres 16 via Prisma

Schema: [schema.prisma](apps/api/prisma/schema.prisma). Migrations committed. Only the API touches the DB.

### 🤝 Why these choices

| Choice                             | Reason                                                   |
| ---------------------------------- | -------------------------------------------------------- |
| 🔀 **Split web and api**           | Each can scale or deploy on its own.                     |
| 📦 **Prisma migrations in repo**   | Schema changes are reviewable. Same schema everywhere.   |
| 🪶 **Stateless API, CORS-locked**  | Simple. Secure. No sessions, no CSRF tokens needed.      |
| ⚡ **Turbo**                       | Skips work that hasn't changed. Big win in CI.           |

---

## ✅ How the brief is addressed

### 🔒 Validation & Security

**Validation runs twice.** Client for UX, server for trust.

- 🖥️ **Client** — [Zod](https://zod.dev) + `react-hook-form` in [DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx). Errors show inline. Nothing is sent until the form is valid.
- 🖧 **Server** — `class-validator` DTO ([create-lead.dto.ts](apps/api/src/modules/leads/dto/create-lead.dto.ts)) with `@IsEmail`, `@IsISO31661Alpha2`, `@Length`. A global pipe in [main.ts](apps/api/src/main.ts) rejects unknown fields. The API never trusts the client.

**🧼 XSS** — `name` and `message` are stripped of all HTML with `sanitize-html` before they hit the DB ([sanitize.ts](apps/api/src/core/security/sanitize.ts)). Helmet sets security headers (CSP, X-Frame-Options, etc.). React escapes output by default.

**🛡️ CSRF** — The API is stateless. No cookies, no sessions. CORS is locked to `CORS_ORIGIN` with `credentials: false`. Without ambient credentials, cross-site forged requests can't authenticate. If cookies are added later, drop in a CSRF token layer (the boundary is already in [main.ts](apps/api/src/main.ts)).

**🚦 Rate limiting** — `@nestjs/throttler` as a global guard ([throttler.module.ts](apps/api/src/core/throttler/throttler.module.ts)): **10 req/min** global, **5 req/min per IP** on `POST /leads` ([leads.controller.ts](apps/api/src/modules/leads/leads.controller.ts)). Plus a 100kb body cap. Stops casual spam without a captcha.

**📝 Logging (Pino)** — `nestjs-pino` in [logger.module.ts](apps/api/src/core/logger/logger.module.ts) writes one line per request. Pretty in dev, JSON in prod. `redact` scrubs `authorization`, `cookie`, and `req.body.businessEmail`, so PII never reaches the logs. Useful for spotting spam bursts (429s) or bad inputs (400s) without leaking user data.

---

### 🎨 UI/UX

**📱 Responsive** — mobile-first Tailwind. Form stacks on mobile, splits into two columns from `sm:` up ([DemoForm.tsx:174](apps/web/src/components/landing/DemoForm.tsx#L174)).

**💬 Feedback** — every state is distinct:

| State                    | What the user sees                                          |
| ------------------------ | ----------------------------------------------------------- |
| ⚠️ Inline errors         | Zod message under the field, wired with `aria-describedby`  |
| ⏳ Submitting            | Spinner on the button. Inputs disabled.                     |
| ✅ Success (201)         | Success panel with a "Submit another" button                |
| ❌ Bad input (400)       | Server message in an `role="alert"` banner                  |
| 🚫 Throttled (429)       | "Too many requests, try again later"                        |
| 🔌 Network fail          | "Unable to reach the server"                                |

**♿ Accessibility** — `htmlFor` labels, focus rings preserved, Radix `Select` for full keyboard + screen-reader support.

---

### ⚡ Performance

- 🖼️ **Images** are `.webp` served through `next/image` with `sizes` hints, so the browser only downloads what it paints.
- 🥇 **LCP** — the hero uses `priority` ([Hero.tsx:33-34](apps/web/src/components/landing/Hero.tsx#L33-L34)), so it's preloaded.
- 🔤 **Fonts self-hosted** under [apps/web/public/fonts](apps/web/public/fonts) — no third-party round trip.
- 🧩 **Server components by default** — only [DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx) ships JS to the browser.
- 🏎️ **Turbo** caches `build`/`lint`/`test` — unchanged packages are skipped.

---

### 🧪 Testing

E2E tests in [apps/api/test](apps/api/test) run the real Nest app against a real Postgres. **No mocks.** The point is to prove validation, sanitization, throttling, and the schema all fit together.

Covered:

- ✅ Happy path
- ⚠️ Validation errors (missing, bad email, unknown props)
- 🧼 HTML sanitization on `name`/`message`
- 🚦 The 5 req/min throttle

CI runs the same suite against a fresh Postgres on every PR.

---

### 🚀 CI/CD

Three parallel jobs (lint, build, api-integration). Real Postgres in CI. Turbo + Next build caching. See [CI pipeline](#-ci-pipeline).

---

## 🛠️ Prerequisites

- 🟢 **Node.js 20+**
- 📦 **pnpm 9** — `corepack enable && corepack prepare pnpm@9.12.0 --activate`
- 🐳 **Docker Desktop**

> 🍎 On Apple Silicon, the `postgres:16-alpine` image pulls the `arm64` variant automatically. Nothing else to configure.

---

## ▶️ Run it locally

```bash
# 1️⃣ Install
pnpm install

# 2️⃣ Start Postgres (exposed on 55432 to avoid clashing with a native one)
docker compose up -d postgres

# 3️⃣ Configure env
cp apps/web/.env.local.example apps/web/.env.local
# apps/api/.env is already committed with local defaults

# 4️⃣ Apply the schema
pnpm db:migrate

# 5️⃣ Run both apps
pnpm dev
```

- 🌐 Web → http://localhost:3000
- ⚙️ API → http://localhost:3001 (health: `/health`, `/health/ready`)

---

## 🔍 Check a submission

After submitting the **Request a Demo** form, open Prisma Studio to see the row:

```bash
pnpm db:studio
```

Open http://localhost:5555 and select the **`Lead`** table. You'll see `name`, `businessEmail`, `country`, `message` (HTML-stripped), and `createdAt`.

---

## 📜 Commands

| Command                  | What it does                                        |
| ------------------------ | --------------------------------------------------- |
| `pnpm dev`               | 🏃 Run web + api in watch mode                       |
| `pnpm build`             | 📦 Build both apps                                   |
| `pnpm lint`              | 🔍 Lint both apps                                    |
| `pnpm test:e2e`          | 🧪 Run the API e2e suite                             |
| `pnpm db:migrate`        | 🗄️ Create/apply a Prisma migration                   |
| `pnpm db:studio`         | 🔎 Open Prisma Studio                                |
| `docker compose down`    | ⏹️ Stop Postgres (data persists)                     |
| `docker compose down -v` | 🧨 Stop Postgres **and** wipe the volume             |

---

## 🌱 Environment

- 📄 **`apps/api/.env`** — `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`. Checked at boot ([env.validation.ts](apps/api/src/core/config/env.validation.ts)); the app won't start if anything is missing.
- 📄 **`apps/web/.env.local`** — `NEXT_PUBLIC_API_URL` points the browser at the API.

---

## 🤖 CI pipeline

Defined in [.github/workflows/ci.yml](.github/workflows/ci.yml). Runs on every push to `main` and every PR. New commits cancel in-flight runs on the same branch.

Three jobs run in parallel on Node 20 + pnpm 9 (`--frozen-lockfile`):

### 1️⃣ Lint
`pnpm turbo run lint`. Turbo cache via `actions/cache`.

### 2️⃣ Build
`pnpm turbo run build`. Caches Turbo output and `apps/web/.next/cache`, so unchanged builds stay warm.

### 3️⃣ API integration
Boots `postgres:16-alpine` as a service, runs `prisma migrate deploy`, then runs the API e2e suite against it.

> 🔐 Permissions locked to `contents: read`. Turbo telemetry disabled.

---

## 📁 Repo layout

```
apps/
  api/                 ⚙️  NestJS + Prisma + e2e tests
  web/                 🌐  Next.js
docker-compose.yml     🐳  Postgres
turbo.json             ⚡  Task graph
pnpm-workspace.yaml    📦  Workspace config
```
