# 🏟️ Request Demo Portal

> A **Next.js** landing page + **NestJS** API + **Postgres**, in one monorepo.

> 🌿 **You're reading the `out-of-scope` branch.** This branch adds Dockerization, Terraform on AWS, and a GitHub Actions deploy pipeline on top of the features `main` already has. See [🌿 What's on this branch (not on `main`)](#-whats-on-this-branch-not-on-main) below.

---

## 🔗 Live deployment (POC)

| | URL |
| --- | --- |
| 🌐 **Web** | http://rd-portal-alb-819135911.ap-southeast-1.elb.amazonaws.com |
| ⚙️ **API health** | http://rd-portal-alb-819135911.ap-southeast-1.elb.amazonaws.com/api/health/ready |
| 📮 **API lead submit** | `POST /api/leads` on the same origin |

Running on AWS (ECS Fargate Spot + RDS Postgres + ALB) in `ap-southeast-1`. ~$37/mo, plain HTTP (no domain).

---

## 📑 Contents

- [🌿 What's on this branch (not on `main`)](#-whats-on-this-branch-not-on-main)
- [🏗️ Architecture](#️-architecture)
  - [☁️ Deployed architecture (AWS)](#️-deployed-architecture-aws)
  - [🚢 Deploy pipeline](#-deploy-pipeline)
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
- [☁️ Deploy to AWS](#️-deploy-to-aws)
- [📁 Repo layout](#-repo-layout)

---

## 🌿 What's on this branch (not on `main`)

`main` has the full working app + local dev setup. This branch adds everything needed to **ship it to AWS** and deploy on every push.

| Addition | Where | What it does |
| --- | --- | --- |
| 🐳 **API Dockerfile** | [apps/api/Dockerfile](apps/api/Dockerfile) | Multi-stage pnpm build. Runs `prisma migrate deploy` on start. Handles workspace symlinks by copying the whole `/repo` tree into the runtime stage (`pnpm deploy` bundle was losing the generated `.prisma/client/`). |
| 🐳 **Web Dockerfile** | [apps/web/Dockerfile](apps/web/Dockerfile) | Multi-stage Next.js build with `output: "standalone"` so the runtime image ships only the standalone server + static assets. |
| 🧭 **NestJS global prefix** | [apps/api/src/main.ts](apps/api/src/main.ts) | `app.setGlobalPrefix("api")` — routes now live at `/api/*` so the ALB can path-route from a single listener without CORS. |
| 🌐 **Web calls same-origin** | [apps/web/src/components/landing/DemoForm.tsx](apps/web/src/components/landing/DemoForm.tsx) | Form POSTs to `/api/leads` (relative) — no `NEXT_PUBLIC_API_URL` needed in prod. |
| 🧱 **Terraform** (`infra/`) | [infra/](infra/) | Full AWS stack: VPC, ALB, ECR, ECS Fargate Spot, RDS, IAM (incl. OIDC for GitHub → AWS), Secrets Manager. Split by concern (`main.tf`, `alb.tf`, `rds.tf`, `ecs.tf`, `github-oidc.tf`, `versions.tf`). |
| 🤖 **Deploy workflow** | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | Two-job CI: build & push images to ECR, then force-roll ECS services. Auto-fetches the ALB DNS; uses OIDC for AWS auth (no long-lived keys). |
| 📖 **Infra README** | [infra/README.md](infra/README.md) | Cost breakdown, first-deploy walkthrough, teardown. |

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
            │                       │
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

**Request flow (demo form submit):**

1. Browser fetches `/` → ALB default action → web TG → Next.js (SSR)
2. Browser runs `fetch('/api/leads', ...)` — **same-origin**, no CORS preflight
3. ALB listener rule matches `/api/*` → api TG → NestJS with `setGlobalPrefix('api')`
4. NestJS validates, sanitizes, throttles, inserts into RDS Postgres via `DATABASE_URL` from Secrets Manager

**Security boundaries:**

| Layer | Rule |
| --- | --- |
| ALB SG | accepts `:80` from anywhere |
| ECS SG | accepts `:3000`/`:3001` **only** from ALB SG |
| RDS SG | accepts `:5432` **only** from ECS SG |
| IAM | Execution role (pulls image, reads secrets, writes logs) ≠ Task role (empty for now; S3/SES/etc. go here) |
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
- ⚙️ API → http://localhost:3001 (health: `/api/health`, `/api/health/ready`)

> Note: this branch prefixes all API routes with `/api` (see [apps/api/src/main.ts](apps/api/src/main.ts)) so the deployed ALB can path-route everything same-origin.

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

The **deploy** workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) runs on `push` to `main` or `out-of-scope` — see below.

---

## ☁️ Deploy to AWS

Single `terraform apply` + one `git push`. All AWS state is in [infra/](infra/), and a push to this branch triggers the deploy pipeline. Full walkthrough: [infra/README.md](infra/README.md).

### 🧱 What Terraform creates

| File | Resources |
| --- | --- |
| [infra/main.tf](infra/main.tf) | VPC, two public subnets (2 AZs), IGW, route table, security groups (ALB → ECS → RDS) |
| [infra/alb.tf](infra/alb.tf) | ALB, single `:80` listener, `/api/*` listener rule routing to api TG (else web TG) |
| [infra/rds.tf](infra/rds.tf) | Postgres 16 `db.t3.micro`, generated password, `DATABASE_URL` composed into a Secrets Manager secret |
| [infra/ecs.tf](infra/ecs.tf) | ECR repos, Fargate Spot cluster, task definitions with task + execution role split, services |
| [infra/github-oidc.tf](infra/github-oidc.tf) | OIDC provider, deploy role trusted only from `refs/heads/out-of-scope` on this repo, scoped IAM policy |
| [infra/versions.tf](infra/versions.tf) | Pinned Terraform + provider versions |

### 🤖 Deploy workflow

Defined in [.github/workflows/deploy.yml](.github/workflows/deploy.yml). On push to `main` or `out-of-scope`:

1. 🔑 **OIDC** → assume `rd-portal-github-deploy` (no AWS keys in GitHub)
2. 📡 **Fetch ALB DNS** via `aws elbv2 describe-load-balancers` — no hardcoded URLs
3. 🐳 **Build + push** api + web images (SHA tag + `latest`, gha cache)
4. 🔁 **Roll** both ECS services with `--force-new-deployment`
5. ⏱️ **Wait** for `services-stable` before marking success
6. 📋 **Summary** — deployed SHA + URL on the run page

### 🏷️ IAM — least-privilege deploy role

The deploy role can do only these things ([infra/github-oidc.tf](infra/github-oidc.tf)):

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

### 🧭 Deliberate POC simplifications (not prod-ready)

- 🔓 Plain HTTP — no domain, no ACM/HTTPS
- 🗄️ Single-AZ RDS, no backups
- 🔁 One task per service, no autoscaling; Spot can be interrupted
- 📈 No CloudFront, no WAF, no alarms
- 🌍 CORS wiring is still in code for when API gets its own origin later

---

## 📁 Repo layout

```
apps/
  api/                 ⚙️  NestJS + Prisma + e2e tests + Dockerfile
  web/                 🌐  Next.js (standalone) + Dockerfile
infra/                 🧱  Terraform (AWS ECS Fargate + RDS + ALB + OIDC)
.github/workflows/
  ci.yml               🧪  Lint + build + e2e against real Postgres
  deploy.yml           🚢  Build → push ECR → roll ECS (OIDC auth)
docker-compose.yml     🐳  Postgres for local dev
turbo.json             ⚡  Task graph
pnpm-workspace.yaml    📦  Workspace config
```
