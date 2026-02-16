#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-}"

if [ -z "$COMMAND" ]; then
  echo "Usage: scripts/db.sh <command>" >&2
  echo "Commands: generate, migrate, reset, seed" >&2
  exit 1
fi

# Commands blocked in production (destructive or dev-only)
BLOCKED_COMMANDS="generate reset seed"
if [ "${NODE_ENV:-}" = "production" ] && echo "$BLOCKED_COMMANDS" | grep -qw "$COMMAND"; then
  echo "ERROR: db:$COMMAND is disabled in production (NODE_ENV=production)" >&2
  exit 1
fi

# Whitelist-validate the command
ALLOWED_COMMANDS="generate migrate reset seed studio push"
if ! echo "$ALLOWED_COMMANDS" | grep -qw "$COMMAND"; then
  echo "ERROR: unknown command '$COMMAND'. Allowed: $ALLOWED_COMMANDS" >&2
  exit 1
fi

# Load .env from repo root
# Trusted: .env is gitignored and developer-managed
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT_DIR/.env" ]; then
  set -a; source "$ROOT_DIR/.env"; set +a
fi

cd "$ROOT_DIR/apps/api"
bun run "db:$COMMAND"
