#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-}"

if [ -z "$COMMAND" ]; then
  echo "Usage: scripts/db.sh <command>" >&2
  echo "Commands: generate, migrate, reset, seed" >&2
  exit 1
fi

# Destructive commands (reset, seed) are blocked in production
DESTRUCTIVE_COMMANDS="reset seed"
if [ "${NODE_ENV:-}" = "production" ] && echo "$DESTRUCTIVE_COMMANDS" | grep -qw "$COMMAND"; then
  echo "ERROR: db:$COMMAND is disabled in production (NODE_ENV=production)" >&2
  exit 1
fi

# Load .env from repo root
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT_DIR/.env" ]; then
  set -a; source "$ROOT_DIR/.env"; set +a
fi

cd "$ROOT_DIR/apps/api"
bun run "db:$COMMAND"
