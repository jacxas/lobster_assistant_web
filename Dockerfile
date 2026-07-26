# ──────────────────────────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace manifests first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY apps/bot/package.json ./apps/bot/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Copy full source after deps are cached
COPY . .

# Build shared first, then server
RUN pnpm --filter @lobster/shared build
RUN pnpm --filter @lobster/server build

# ──────────────────────────────────────────────────────────────────
# Stage 2: Production
# ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

# Copy built server bundle from builder
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Data directory for SQLite persistence
RUN mkdir -p /app/data

RUN addgroup -S lobster && adduser -S lobster -G lobster && \
    chown -R lobster:lobster /app/data
USER lobster

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/status || exit 1

CMD ["node", "apps/server/dist/index.js"]
