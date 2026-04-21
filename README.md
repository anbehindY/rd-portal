# 🏟️ Request Demo Portal

> **Splash → Landing · Admin dashboard · Shipped to AWS.** A **Next.js** front-end + **NestJS** API + **Postgres** in one monorepo, fronted by a splash screen and backed by an at-a-glance admin portal — all running on ECS Fargate behind an ALB.

> 🌿 **You're reading the `out-of-scope` branch.** `main` ships the public landing page and POST-a-lead flow. This branch layers on three additional pillars (see below). Every section in this README is scoped to what's different here — check `main`'s README for the unchanged foundation.

---

## 🔗 Live deployment (POC)

| | URL |
| --- | --- |
| ✦ **Splash (entry)** | http://rd-portal-alb-819135911.ap-southeast-1.elb.amazonaws.com/ |
| 🌐 **Landing** | http://rd-portal-alb-819135911.ap-southeast-1.elb.amazonaws.com/landing |
| 📊 **Admin dashboard** | http://rd-portal-alb-819135911.ap-southeast-1.elb.amazonaws.com/admin |
| ⚙️ **API health** | `…/api/health/ready` |
| 📮 **Submit a lead** | `POST …/api/leads` |
| 📋 **List leads** | `GET  …/api/leads?page=1&pageSize=20&q=` |
| 📈 **Leads stats** | `GET  …/api/leads/stats` |

Running on AWS (ECS Fargate Spot + RDS Postgres + ALB) in `ap-southeast-1`. ~$37/mo, plain HTTP (no domain).

---

## 📑 Contents

- [🌿 Three pillars of this branch](#-three-pillars-of-this-branch)
- [✦ Splash screen](#-splash-screen)
- [📊 Admin portal](#-admin-portal)
- [🏗️ Architecture](#️-architecture)
  - [☁️ Deployed architecture (AWS)](#️-deployed-architecture-aws)
  - [🚢 Deploy pipeline](#-deploy-pipeline)
- [✅ How the brief is addressed](#-how-the-brief-is-addressed)
  - [🔒 Validation & Security](#-validation--security)
  - [🎨 UI/UX](#-uiux)
  - [⚡ Performance](#-performance)
  - [🧪 Testing (TDD)](#-testing-tdd)
  - [🚀 CI/CD](#-cicd)
- [🛠️ Prerequisites](#️-prerequisites)
- [▶️ Run it locally](#️-run-it-locally)
- [🔍 Check a submission](#-check-a-submission)
- [📜 Commands](#-commands)
- [🌱 Environment](#-environment)
- [☁️ Deploy to AWS](#️-deploy-to-aws)
- [🧭 Deliberate POC simplifications](#-deliberate-poc-simplifications)
- [📁 Repo layout](#-repo-layout)

---

## 🌿 Three pillars of this branch

| Pillar | What it is | Where to read more |
| --- | --- | --- |
| ✦ **Splash-first routing** | A minimal two-card entry page at `/` that routes users to either the public landing or the admin dashboard. Splash is the front door; landing moved to `/landing`. | [Splash screen](#-splash-screen) |
| 📊 **Single-page admin dashboard** | A lightweight `/admin` view with stat cards, a 30-day trend bar chart, top-countries breakdown, and a searchable paginated table of every submitted lead. | [Admin portal](#-admin-portal) |
| ☁️ **Full AWS deploy** | Docker for both apps, Terraform-managed VPC + ALB + ECS Fargate Spot + RDS + IAM (with GitHub OIDC), and a `deploy.yml` pipeline that rolls ECS on every push. | [Deploy to AWS](#️-deploy-to-aws) |

Per-file change catalog for the deploy pillar (Dockerfiles, Terraform, ALB wiring, `setGlobalPrefix('api')`, OIDC) lives further down under [☁️ Deploy to AWS](#️-deploy-to-aws).

---

## ✦ Splash screen

**File:** [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx)

The root `/` is now a centered two-card chooser — equal-weight, minimal, matched to the existing zinc/black aesthetic.

- **Two destinations**: `/landing` (public demo page) or `/admin` (dashboard).
- **Keyboard-first**: each card is a `<Link>` with a visible `focus-visible:ring-2 focus-visible:ring-black`. Tab cycles between them; Enter activates.
- **Responsive**: 2-column on `sm+`, stacks on mobile. Verified at 360 / 768 / 1024 / 1440px.
- **Subtle entrance animation**: a single `@keyframes splashFadeUp` in [apps/web/src/app/globals.css](apps/web/src/app/globals.css), applied with staggered `animation-delay`s. No framer-motion, no animation library. Respects `prefers-reduced-motion: reduce`.
- **Logo re-use**: the same `font-logo` "Sport News" wordmark shown in the landing Header, for visual continuity.

---

## 📊 Admin portal

**Route:** `/admin` → [apps/web/src/app/admin/page.tsx](apps/web/src/app/admin/page.tsx)

An at-a-glance view of every submitted demo request, with a small dashboard on top.

### What it shows

| Section | Detail |
| --- | --- |
| 4 **stat cards** | `Total`, `Today`, `Last 7 days`, `Last 30 days`. The `Total` card renders a hand-rolled SVG sparkline over the 30-day series. `Today` uses an emerald accent. |
| **Requests per day (30d)** | Hand-rolled SVG bar chart. Zero-filled buckets for days with no leads. Hover tooltip via native `title` attribute — no JS tooltip library. |
| **Top countries** | Horizontal bar list (top 6), country code + display name + count. |
| **All requests** | Searchable, paginated table. Search runs case-insensitively across `name`, `businessEmail`, `country`. 300ms debounce. 20 per page. |

### Responsive design

- **Stat grid**: `grid-cols-2 lg:grid-cols-4` — 2×2 on mobile, 1×4 on desktop.
- **Chart row**: stacks on `<lg`, becomes a `[2fr_1fr]` split on desktop.
- **Table**: real `<table>` on `sm+`, morphs to a vertical `<ul>` card list on `<sm` (name prominent, email/country muted, message clamped to 2 lines).
- Breakpoints verified at 360 / 768 / 1024 / 1440px.

### Under the hood

- **Data fetching**: plain `fetch()` via [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts) with `cache: 'no-store'`. Matches the pattern used by the lead form in [DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx). No SWR, no tanstack-query. Fewer deps, simpler mental model for a page with two endpoints.
- **Abort on unmount**: each `useEffect` owns an `AbortController` and tears it down on cleanup — no stale-update setState warnings.
- **Derived loading state**: loading is `data === null` rather than a separate flag, sidestepping the React 19 `set-state-in-effect` rule cleanly. A shared `inFlight` counter drives the header refresh spinner.

### Why hand-rolled SVG charts, not recharts

- **Bundle**: recharts is ~90 KB gzipped + D3 dependencies. A sparkline polyline and a row of `<div>` bars weighs ~0 KB.
- **Styling**: recharts' defaults would need extensive overrides to match the zinc/black palette and the existing `rounded-2xl · shadow-sm` surface treatment.
- **Control**: the chart components ([BarChart.tsx](apps/web/src/components/admin/BarChart.tsx), [Sparkline.tsx](apps/web/src/components/admin/Sparkline.tsx), [CountryList.tsx](apps/web/src/components/admin/CountryList.tsx)) are ≤60 lines each and easy to change.

### Why it's open (no auth)

Deliberate POC simplification. Anyone who knows the ALB URL can open `/admin` and see every lead. In production you'd gate it with at minimum basic auth (ALB or middleware) or an OIDC login flow; the trust boundary is already in [apps/api/src/main.ts](apps/api/src/main.ts) where it would sit. Flagged under [Deliberate POC simplifications](#-deliberate-poc-simplifications).

### API endpoints backing the dashboard

Both are new on this branch, in [apps/api/src/modules/leads/leads.controller.ts](apps/api/src/modules/leads/leads.controller.ts):

| Endpoint | Query | Response |
| --- | --- | --- |
| `GET /api/leads` | `page`, `pageSize` (max 100, server-clamped), `q` | `{ items: Lead[], total, page, pageSize }` — newest first |
| `GET /api/leads/stats` | — | `{ total, today, last7d, last30d, perDay: {date,count}[30], topCountries: {country,count}[≤6] }` |

Aggregates run in a single `prisma.$transaction`. `perDay` uses a raw `TO_CHAR … AT TIME ZONE 'UTC'` SQL group-by so bucket keys are deterministic strings. Window is rolling 24h / 7d / 30d; `perDay` covers 30 UTC calendar days up to and including today.

Throttling: `@Throttle({ limit: 60, ttl: 60_000 })` on each GET — well above dashboard needs, below abuse territory.

---

## 🏗️ Architecture

Two apps. One lockfile. **pnpm workspaces + Turborepo** for caching and parallel tasks.

### 🌐 [apps/web](apps/web) — Next.js 16 + React 19 + Tailwind v4

Three routes now: `/` (splash, server component), `/landing` (the original public page), `/admin` (client component, fetches `/api/leads` + `/api/leads/stats`). Only the admin page and the demo form ship JS to the browser.

### ⚙️ [apps/api](apps/api) — NestJS 10

- **`core/`** — shared infra: env validation, Prisma, Pino logger, throttler, HTML sanitizer, exception filter.
- **`modules/`** — features: `health` and `leads` (now with GET list + GET stats).

**🛡️ Hardening in [main.ts](apps/api/src/main.ts):** Helmet, 100kb body cap, strict validation pipe, CORS locked to the web origin, no cookies.

### 🗄️ Postgres 16 via Prisma

Schema: [schema.prisma](apps/api/prisma/schema.prisma). Unchanged from `main` — no new tables or columns needed for the admin portal (it only reads what `POST /leads` already writes).

### ☁️ Deployed architecture (AWS)

```
                    🌍 Internet
                         │
                         ▼
         ┌──────────────────────────────┐
         │  🌐 Application Load Balancer │  public, :80
         │   rd-portal-alb               │
         └──────────────┬───────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
       path: /api/*           everything else
            │                (/  /landing  /admin)
            ▼                       ▼
      ┌──────────┐            ┌──────────┐
      │ api TG   │            │ web TG   │
      │  :3001   │            │  :3000   │
      └─────┬────┘            └─────┬────┘
            │                       │
            ▼                       ▼
      ┌──────────┐            ┌──────────┐
      │ ECS task │            │ ECS task │
      │ rd-api   │            │ rd-web   │
      │ Fargate  │            │ Fargate  │
      │ Spot     │            │ Spot     │
      │ 256/512  │            │ 256/512  │
      └─────┬────┘            └──────────┘
            │
            ▼
      ┌──────────────┐
      │ 🗄️  RDS       │
      │ Postgres 16  │
      │ db.t3.micro  │
      │ private SG   │
      └──────────────┘
```

**Request flows:**

| From | Goes to |
| --- | --- |
| `GET /` | Splash (web TG) |
| `GET /landing`, `GET /admin` | Next.js server (web TG) |
| `fetch('/api/leads')` from the admin page | `/api/*` rule → api TG → `LeadsService.list()` |
| `fetch('/api/leads/stats')` | `/api/*` rule → api TG → `LeadsService.stats()` |
| `fetch('/api/leads', {method:'POST'})` from the demo form | `/api/*` rule → api TG → validate → sanitize → RDS |

All paths are **same-origin** — no CORS preflight on the client.

**Security boundaries (unchanged):**

| Layer | Rule |
| --- | --- |
| ALB SG | accepts `:80` from anywhere |
| ECS SG | accepts `:3000`/`:3001` **only** from ALB SG |
| RDS SG | accepts `:5432` **only** from ECS SG |
| IAM | Execution role (pulls image, reads secrets, writes logs) ≠ Task role (empty for now) |
| CI auth | GitHub OIDC; trust scoped to `repo:anbehindY/rd-portal:ref:refs/heads/out-of-scope` |

### 🚢 Deploy pipeline

```
       git push origin out-of-scope
                 │
                 ▼
       GitHub Actions: deploy.yml
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
   build-push         (OIDC → AWS)
   • fetch ALB DNS (describe-load-balancers)
   • docker buildx build (gha cache)
   • push SHA + latest → ECR
                 │
                 ▼
      deploy (OIDC → AWS)
      • aws ecs update-service --force-new-deployment (api + web)
      • aws ecs wait services-stable
      • step summary with deployed SHA + URL
```

---

## ✅ How the brief is addressed

### 🔒 Validation & Security

**Validation runs twice.** Client for UX, server for trust.

- 🖥️ **Client** — [Zod](https://zod.dev) + `react-hook-form` in [DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx). Errors show inline. Nothing is sent until the form is valid.
- 🖧 **Server (POST)** — `class-validator` DTO ([create-lead.dto.ts](apps/api/src/modules/leads/dto/create-lead.dto.ts)) with `@IsEmail`, `@IsISO31661Alpha2`, `@Length`. The global pipe in [main.ts](apps/api/src/main.ts) rejects unknown fields.
- 🖧 **Server (GET list)** — new DTO ([list-leads.dto.ts](apps/api/src/modules/leads/dto/list-leads.dto.ts)) with `@IsInt @Min(1)` on `page` and `pageSize`. `Number('abc')` and negative values return 400. `pageSize > 100` is **clamped** (not rejected) so a curious client gets results.

**🧼 XSS** — `name` and `message` are stripped of all HTML with `sanitize-html` before they hit the DB ([sanitize.ts](apps/api/src/core/security/sanitize.ts)). The admin table then renders those fields as plain text through React (which escapes by default) — no `dangerouslySetInnerHTML` anywhere.

**🛡️ CSRF** — The API is stateless. No cookies, no sessions. CORS is locked to `CORS_ORIGIN` with `credentials: false`. The admin-portal GETs are cookie-free too; they just fetch same-origin.

**🚦 Rate limiting** — `@nestjs/throttler` as a global guard: **10 req/min** default, **5 req/min** on `POST /leads`, **60 req/min** on each GET. Plus a 100kb body cap.

**📝 Logging (Pino)** — request log line per hit; `redact` still scrubs `authorization`, `cookie`, and `req.body.businessEmail`.

- ⚠️ **Admin is open** — deliberate POC simplification; see [Deliberate POC simplifications](#-deliberate-poc-simplifications).

---

### 🎨 UI/UX

**📱 Responsive everywhere** — mobile-first Tailwind. Every new view was designed mobile-first:
- **Splash**: 1-col card stack `<sm`, 2-col `sm+`.
- **Admin stat cards**: `grid-cols-2 lg:grid-cols-4`.
- **Admin chart row**: stacks `<lg`, `[2fr_1fr]` on desktop.
- **Admin table**: real `<table>` on `sm+`, `<ul>` card list on mobile.

**💬 Feedback states** — the lead form's state machine (submitting / 201 / 400 / 429 / network-fail) is unchanged. The admin page adds:

| State | What the user sees |
| --- | --- |
| ⏳ Initial load | Pulse-skeleton stat cards, chart, and table (matched to final layout — no jumps) |
| ⟳ Refreshing | Refresh button spins; stale data stays on screen (no flicker) |
| 🔍 Searching | Debounced 300ms; resets to page 1 |
| 🫥 Empty | "No requests yet — submissions will appear here" centered in the table surface |
| ❌ Error | Red banner above the sections, mirroring the DemoForm error style |

**♿ Accessibility** —
- Splash cards are real `<Link>`s; visible focus ring; each with a leading icon `aria-hidden`.
- Admin header has `role="alert"` on the error banner, `aria-label` on nav / search / refresh.
- Tables use `<th>` headers; mobile list uses semantic `<ul>`.
- Charts have `role="img"` + descriptive `aria-label`s.

**🎨 Design tokens & consistency** — admin and splash reuse the existing Tailwind palette and font stack (`Geist`, `Inter`, `Figtree`, `Darkline`), the same radii (`rounded-2xl` surfaces, `rounded-xl` buttons), and the `border border-zinc-200/60 shadow-sm` panel treatment used on the landing form card. No new design system introduced.

---

### ⚡ Performance

- 🖼️ **Landing images** are `.webp` served through `next/image` with `sizes` hints.
- 🥇 **LCP** — landing hero is marked `priority`.
- 🔤 **Fonts self-hosted** under [apps/web/public/fonts](apps/web/public/fonts).
- 🧩 **Server components by default** — splash and landing are server-rendered; only the admin page and the demo form ship client JS.
- 📦 **No chart library** — the admin page ships no third-party chart/data-fetching code.
- 🏎️ **Turbo** caches `build`/`lint`/`test` — unchanged packages are skipped.

---

### 🧪 Testing (TDD)

The new API endpoints on this branch were built **test-first**. The workflow: write the failing e2e case, run it to confirm it fails for the right reason (route not found / wrong shape), implement the minimum code to pass, refactor.

Test file: [apps/api/test/leads.e2e-spec.ts](apps/api/test/leads.e2e-spec.ts). All cases run against a **real Postgres** (the existing setup — no mocks).

| Suite | Coverage |
| --- | --- |
| `POST /leads` (existing) | Happy path + normalization, 400 on bad email / missing fields / unknown props, HTML sanitization, 429 after 5/60s burst |
| `GET /leads` (new) | Empty state, newest-first ordering, `pageSize`, `page=2`, case-insensitive `q` across name/email/country, `pageSize` clamped to 100, 400 on negative or non-numeric `page`/`pageSize` |
| `GET /leads/stats` (new) | Zero-state (all counts 0, 30 zero-filled perDay buckets, empty topCountries), rolling-window counts (24h / 7d / 30d seeded with known `createdAt`), perDay buckets by calendar day, topCountries sorted desc and capped at 6 |

Web UI was manually UX-checked in a browser (no web test framework added — mirrors `main`'s pattern). Checklist:
1. `/` renders two cards; Tab cycles, Enter activates each one.
2. `/landing` still submits a lead and shows the 201 success panel.
3. `/admin` renders stat cards, bar chart, country list, and table with seeded data.
4. Search filters the table (case-insensitive); pagination works; refresh button re-fetches.
5. DevTools 360×640: stat grid 2×2, charts stacked, table → card list.

CI runs the API e2e suite against a fresh Postgres on every PR.

---

### 🚀 CI/CD

Three parallel jobs (lint, build, api-integration). Real Postgres in CI. Turbo + Next build caching. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

The **deploy** workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) runs on push to `main` or `out-of-scope` — OIDC → ECR build/push → force-roll ECS services → wait for stable.

---

## 🛠️ Prerequisites

- 🟢 **Node.js 20+**
- 📦 **pnpm 9** — `corepack enable && corepack prepare pnpm@9.12.0 --activate`
- 🐳 **Docker Desktop**

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

- ✦ Splash → http://localhost:3000
- 🌐 Landing → http://localhost:3000/landing
- 📊 Admin → http://localhost:3000/admin
- ⚙️ API → http://localhost:3001 (health: `/api/health`, `/api/health/ready`)

---

## 🔍 Check a submission

After submitting the **Request a Demo** form, there are two ways to see it:

1. Open **http://localhost:3000/admin** — the new request shows up after the next poll / refresh.
2. Or run `pnpm db:studio` and open http://localhost:5555 → **`Lead`** table.

---

## 📜 Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | 🏃 Run web + api in watch mode |
| `pnpm build` | 📦 Build both apps |
| `pnpm lint` | 🔍 Lint both apps |
| `pnpm test:e2e` | 🧪 Run the API e2e suite (POST + GET list + GET stats) |
| `pnpm db:migrate` | 🗄️ Create/apply a Prisma migration |
| `pnpm db:studio` | 🔎 Open Prisma Studio |
| `docker compose down` | ⏹️ Stop Postgres (data persists) |
| `docker compose down -v` | 🧨 Stop Postgres **and** wipe the volume |

---

## 🌱 Environment

- 📄 **`apps/api/.env`** — `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`. Checked at boot ([env.validation.ts](apps/api/src/core/config/env.validation.ts)); the app won't start if anything is missing.
- 📄 **`apps/web/.env.local`** — `NEXT_PUBLIC_API_URL` points the browser at the API (only needed in local dev; production runs same-origin via the ALB).

---

## ☁️ Deploy to AWS

Single `terraform apply` + one `git push`. All AWS state is in [infra/](infra/); a push to this branch triggers the deploy pipeline. Full walkthrough: [infra/README.md](infra/README.md).

### 🧱 What Terraform creates

| File | Resources |
| --- | --- |
| [infra/main.tf](infra/main.tf) | VPC, two public subnets (2 AZs), IGW, route table, security groups (ALB → ECS → RDS) |
| [infra/alb.tf](infra/alb.tf) | ALB, single `:80` listener, `/api/*` listener rule routing to api TG (else web TG) |
| [infra/rds.tf](infra/rds.tf) | Postgres 16 `db.t3.micro`, generated password, `DATABASE_URL` composed into a Secrets Manager secret |
| [infra/ecs.tf](infra/ecs.tf) | ECR repos, Fargate Spot cluster, task definitions with task + execution role split, services |
| [infra/github-oidc.tf](infra/github-oidc.tf) | OIDC provider, deploy role trusted only from `refs/heads/out-of-scope` on this repo, scoped IAM policy |
| [infra/versions.tf](infra/versions.tf) | Pinned Terraform + provider versions |

### 🐳 Branch-specific Docker + Nest wiring

| Addition | Where | What it does |
| --- | --- | --- |
| **API Dockerfile** | [apps/api/Dockerfile](apps/api/Dockerfile) | Multi-stage pnpm build. Runs `prisma migrate deploy` on start. Copies the whole `/repo` tree into runtime (pnpm's `deploy` bundle was dropping the generated `.prisma/client/`). |
| **Web Dockerfile** | [apps/web/Dockerfile](apps/web/Dockerfile) | Multi-stage Next.js build with `output: "standalone"`. Ships only the standalone server + static assets. |
| **NestJS global prefix** | [apps/api/src/main.ts](apps/api/src/main.ts) | `app.setGlobalPrefix("api")` — routes live at `/api/*` so the ALB path-routes from a single listener, no CORS. |
| **Web calls same-origin in prod** | [DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx), [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts) | Requests use relative `/api/*` — `NEXT_PUBLIC_API_URL` only set in local dev. |

### 🏷️ IAM — least-privilege deploy role ([infra/github-oidc.tf](infra/github-oidc.tf))

- `ecr:*` limited to the two rd-portal repos
- `ecs:UpdateService` + describe actions (no task-def registration yet)
- `elasticloadbalancing:DescribeLoadBalancers` (to read the ALB DNS)
- Nothing else. No `iam:*`, no database admin, no secret writes.

### 💸 Cost — ~$37/mo

| Resource | ~$/mo |
| --- | --- |
| ALB | $16 |
| 2× Fargate Spot (0.25 vCPU / 0.5 GB) | $6 |
| RDS db.t3.micro + 20 GB gp2 | $14 |
| ECR / CloudWatch / data | $1 |

---

## 🧭 Deliberate POC simplifications

Not production-ready — intentional scope cuts for this POC:

- 🔓 **Admin portal is open** — no auth on `/admin` or on `GET /api/leads` / `GET /api/leads/stats`. Anyone who knows the ALB URL can read all leads. Gate with basic auth or OIDC before any real use.
- 📊 **No stats caching** — `GET /api/leads/stats` runs four `count()` queries, one `$queryRaw`, and a `groupBy` on every call. Fine at POC scale; at higher traffic you'd cache the aggregates (Redis or a materialized view refreshed on insert).
- 🔓 **Plain HTTP** — no domain, no ACM/HTTPS.
- 🗄️ **Single-AZ RDS**, no backups.
- 🔁 **One task per service**, no autoscaling; Spot can be interrupted.
- 📈 **No CloudFront, no WAF, no alarms.**
- 🌍 **CORS wiring** is still in code for when the API gets its own origin later.

---

## 📁 Repo layout

```
apps/
  api/
    prisma/                🗄️  schema + migrations
    src/
      core/                🧩  env, prisma, logger, throttler, sanitize, filters
      modules/
        health/            ❤️  liveness + readiness
        leads/
          dto/             📥  create-lead.dto.ts · list-leads.dto.ts (new)
          leads.controller.ts   POST + GET list + GET stats (new)
          leads.service.ts      create() + list() + stats() (new)
    test/                  🧪  e2e specs — POST + GET list + GET stats
    Dockerfile             🐳
  web/
    src/
      app/
        page.tsx           ✦  Splash (was: landing)
        landing/page.tsx   🌐 Landing (moved here)
        admin/page.tsx     📊 Admin dashboard (new)
      components/
        landing/           🌐  Hero · CategoryGrid · RequestDemo · DemoForm · Header
        admin/             📊  AdminHeader · StatCard · Sparkline · BarChart · CountryList · LeadsTable · Pagination (new)
        ui/                🧰  Button · Input · Select · Textarea · FormField
      lib/
        api.ts             🌐  getLeads() + getStats() fetch helpers (new)
        cn.ts              🧵  className joiner
        countries.ts       🌍  ISO alpha-2 code → display name
    Dockerfile             🐳
infra/                     🧱  Terraform (AWS ECS Fargate + RDS + ALB + OIDC)
.github/workflows/
  ci.yml                   🧪  Lint + build + e2e against real Postgres
  deploy.yml               🚢  Build → push ECR → roll ECS (OIDC auth)
docker-compose.yml         🐳  Postgres for local dev
turbo.json                 ⚡  Task graph
pnpm-workspace.yaml        📦  Workspace config
```
