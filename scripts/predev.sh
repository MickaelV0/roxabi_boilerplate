#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load .env from repo root
if [ -f "$ROOT_DIR/.env" ]; then
  set -a; source "$ROOT_DIR/.env"; set +a
fi

DATABASE_URL="${DATABASE_URL:-}"
if [ -z "$DATABASE_URL" ]; then
  exit 0
fi

JOURNAL="$ROOT_DIR/apps/api/drizzle/migrations/meta/_journal.json"
if [ ! -f "$JOURNAL" ]; then
  exit 0
fi

# Count expected migrations from journal (pure grep, no bun needed)
EXPECTED=$(grep -c '"tag"' "$JOURNAL" || echo "0")
EXPECTED=$((EXPECTED + 0))

if [ "$EXPECTED" -eq 0 ]; then
  exit 0
fi

# Count applied migrations from DB (needs postgres package from apps/api)
# tr -dc strips any non-digit chars from bun output (ANSI codes, CR, etc.)
APPLIED=$(cd "$ROOT_DIR/apps/api" && bun -e "
  import postgres from 'postgres';
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const rows = await sql\`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations\`;
    console.log(rows[0]?.count ?? 0);
  } catch {
    console.log(0);
  } finally {
    await sql.end();
  }
" 2>/dev/null | tr -dc '0-9' || echo "0")
APPLIED=${APPLIED:-0}

PENDING=$((EXPECTED - APPLIED))
if [ "$PENDING" -le 0 ]; then
  exit 0
fi

echo ""
echo "⚠  $PENDING pending database migration(s) detected."
read -r -p "   Run migrations now? [Y/n] " REPLY
echo ""

REPLY="${REPLY:-Y}"
if [[ "$REPLY" =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
  bash "$ROOT_DIR/scripts/db.sh" migrate
fi
