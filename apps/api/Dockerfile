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
# Build, then produce a symlink-free standalone bundle at /out.
# pnpm's workspace node_modules uses symlinks into /repo/node_modules/.pnpm
# that don't survive a simple COPY — `deploy` resolves them into real files.
RUN pnpm --filter @rd-portal/api exec prisma generate \
 && pnpm --filter @rd-portal/api build \
 && pnpm --filter @rd-portal/api deploy /out

FROM node:20-alpine AS runtime
WORKDIR /app
# OpenSSL is required by Prisma engines at runtime; alpine doesn't ship it.
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /out ./
EXPOSE 3001
USER node
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
