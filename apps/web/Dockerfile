# =============================================================================
# Web Dockerfile — Multi-stage build (TanStack Start + Nitro SSR)
# Build context: repo root (.)
# Usage: docker build -f apps/web/Dockerfile .
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM oven/bun:1.3 AS deps

WORKDIR /app

# Copy lockfile and workspace package manifests for dependency resolution
COPY bun.lock package.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/

# Install production + dev dependencies (dev needed for build step)
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM oven/bun:1.3 AS build

WORKDIR /app

# Copy installed dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules

# Copy source code
COPY packages/types/ packages/types/
COPY packages/config/ packages/config/
COPY packages/ui/ packages/ui/
COPY apps/web/ apps/web/

# Build the web app (TanStack Start → Nitro output)
WORKDIR /app/apps/web
RUN bun run build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM node:24-slim AS runtime

WORKDIR /app

# TODO: verify exact Nitro output structure after first local build
# TanStack Start + Nitro outputs to .output/
COPY --from=build /app/apps/web/.output ./.output

ENV NODE_ENV=production
# Default port — override via .env on VPS
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "fetch('http://localhost:3000').then(r => { if (!r.ok) throw 1 })" || exit 1

# TODO: verify Nitro SSR entry point path after first local build
CMD ["node", ".output/server/index.mjs"]
