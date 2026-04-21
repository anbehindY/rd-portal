# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
# Needed by the `postinstall: prisma generate` script.
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter @rd-portal/api...

FROM deps AS build
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN pnpm exec prisma generate && pnpm build

# Preserve the pnpm workspace layout (including .pnpm/ virtual store and
# generated .prisma/client) by copying the entire /repo tree. Simpler and
# more reliable than `pnpm deploy` for mixed pnpm/workspace/generator flows.
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /repo/apps/api
ENV NODE_ENV=production
COPY --from=build --chown=node:node /repo /repo
EXPOSE 3001
USER node
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
