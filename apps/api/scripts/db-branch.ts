/**
 * Branch database lifecycle management.
 *
 * Subcommands:
 *   create [issue_number] [--force]  — Create branch DB, migrate, seed, update .env
 *   drop   [issue_number]            — Drop branch DB (refuses default DB)
 *   list                             — List branch DBs with worktree cross-reference
 *
 * Usage:
 *   tsx scripts/db-branch.ts create          # auto-detect issue from branch name
 *   tsx scripts/db-branch.ts create 150      # explicit issue number
 *   tsx scripts/db-branch.ts create --force  # non-interactive (for /scaffold)
 *   tsx scripts/db-branch.ts drop
 *   tsx scripts/db-branch.ts list
 */

// TODO: implement — parse CLI args (subcommand, issue_number, --force flag)

// TODO: implement — read env: POSTGRES_USER (default 'roxabi'), POSTGRES_PASSWORD (default 'roxabi'), POSTGRES_DB (default 'roxabi')

// TODO: implement — extractIssueNumber(): parse from arg or git branch regex /(?:feat|fix|hotfix)\/(\d+)/

// TODO: implement — checkContainerLiveness(): docker exec roxabi-postgres pg_isready -U $POSTGRES_USER

// TODO: implement — create subcommand:
//   1. Parse issue number
//   2. Check container liveness
//   3. Check if DB exists (psql query)
//   4. Handle existing DB (--force: drop+recreate, interactive: prompt, non-interactive: fail)
//   5. Create DB: docker exec roxabi-postgres createdb -U $POSTGRES_USER roxabi_<N>
//   6. Build DATABASE_URL
//   7. Run migrations: spawn `bun run db:migrate` with DATABASE_URL
//   8. Run seed: spawn `bun run db:seed` with DATABASE_URL
//   9. Update worktree .env: replace ^DATABASE_URL= line
//   10. On failure after step 5: drop DB and exit with error

// TODO: implement — drop subcommand:
//   1. Parse issue number
//   2. Validate: refuse if target === POSTGRES_DB
//   3. Drop: docker exec roxabi-postgres dropdb -U $POSTGRES_USER --if-exists roxabi_<N>

// TODO: implement — list subcommand:
//   1. Query branch DBs: psql "SELECT datname FROM pg_database WHERE datname ~ '^roxabi_[0-9]+$'"
//   2. Parse git worktree list
//   3. Cross-reference and output table

const subcommand = process.argv[2]

if (!subcommand || !['create', 'drop', 'list'].includes(subcommand)) {
  console.error('Usage: tsx scripts/db-branch.ts <create|drop|list> [issue_number] [--force]')
  process.exit(1)
}

console.log(`db-branch: ${subcommand} — not yet implemented`)
process.exit(1)
