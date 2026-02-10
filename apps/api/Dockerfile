# =============================================================================
# API Dockerfile — Multi-stage build
# Build context: repo root (.)
# Usage: docker build -f apps/api/Dockerfile .
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM oven/bun:1.3 AS deps

WORKDIR /app

# Copy lockfile and workspace package manifests for dependency resolution
COPY bun.lock package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/

# Install production + dev dependencies (dev needed for build step)
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM oven/bun:1.3 AS build

WORKDIR /app

# Copy installed dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules

# Copy source code
COPY packages/types/ packages/types/
COPY packages/config/ packages/config/
COPY apps/api/ apps/api/

# Build the API
WORKDIR /app/apps/api
RUN bunx nest build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM node:24-slim AS runtime

WORKDIR /app

# TODO: verify minimal node_modules needed for runtime
# Copy built output and production dependencies
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

# TODO: verify if packages/types dist output is needed at runtime
COPY --from=build /app/packages/types ./packages/types

ENV NODE_ENV=production
# Default port — override via .env on VPS
ENV PORT=4000

EXPOSE 4000

# Health check — endpoint is /health (no global API prefix)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "fetch('http://localhost:4000/health').then(r => { if (!r.ok) throw 1 })" || exit 1

CMD ["node", "dist/main.js"]
