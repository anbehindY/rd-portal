# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
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
# Deploy into /app directly (matches the runtime WORKDIR). pnpm deploy bakes
# absolute paths into bin wrappers' NODE_PATH, so the path must match at runtime.
RUN pnpm --filter @rd-portal/api exec prisma generate \
 && pnpm --filter @rd-portal/api build \
 && pnpm --filter @rd-portal/api deploy /app

FROM node:20-alpine AS runtime
WORKDIR /app
# OpenSSL is required by Prisma engines at runtime; alpine doesn't ship it.
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
EXPOSE 3001
USER node
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
