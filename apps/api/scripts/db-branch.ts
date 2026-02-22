/**
 * Branch database lifecycle management.
 *
 * Subcommands:
 *   create [issue_number] [--force]  — Create branch DB, push schema, seed, update .env
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

import { execSync, spawnSync } from 'node:child_process'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'
import {
  buildDatabaseUrl as buildDatabaseUrlUtil,
  parseWorktreeBlock,
  redactUrl,
  type WorktreeInfo,
} from './db-branch.utils.js'

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const POSTGRES_USER = process.env.POSTGRES_USER ?? 'roxabi'
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'roxabi'
const CONTAINER_NAME = 'roxabi-postgres'

// Validate credentials to prevent shell injection in docker exec commands
const SAFE_CREDENTIAL_PATTERN = /^[a-zA-Z0-9_-]+$/
if (!SAFE_CREDENTIAL_PATTERN.test(POSTGRES_USER)) {
  console.error(
    '[db-branch] ERROR: POSTGRES_USER contains invalid characters (allowed: a-zA-Z0-9_-)'
  )
  process.exit(1)
}
if (!SAFE_CREDENTIAL_PATTERN.test(POSTGRES_PASSWORD)) {
  console.error(
    '[db-branch] ERROR: POSTGRES_PASSWORD contains invalid characters (allowed: a-zA-Z0-9_-)'
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const subcommand = args[0]

if (!(subcommand && ['create', 'drop', 'list'].includes(subcommand))) {
  console.error('Usage: tsx scripts/db-branch.ts <create|drop|list> [issue_number] [--force]')
  process.exit(1)
}

const forceFlag = args.includes('--force')

/** Extract a numeric argument from CLI args (skip flags and subcommand). */
function parseExplicitIssueNumber(): string | undefined {
  for (const arg of args.slice(1)) {
    if (arg.startsWith('--')) continue
    if (/^\d+$/.test(arg)) return arg
  }
  return
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[db-branch] ${message}`)
}

function logError(message: string): void {
  console.error(`[db-branch] ERROR: ${message}`)
}

/** Run a command, returning { status, stdout, stderr }. Never throws. */
function runSafe(cmd: string): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    return { status: 0, stdout, stderr: '' }
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: string; stderr?: string }
    return {
      status: e.status ?? 1,
      stdout: (e.stdout ?? '').toString().trim(),
      stderr: (e.stderr ?? '').toString().trim(),
    }
  }
}

/**
 * Extract issue number from explicit CLI argument or from the current git branch name.
 * Branch patterns: feat/42-slug, fix/15-login, hotfix/42-urgent
 */
function extractIssueNumber(): string {
  const explicit = parseExplicitIssueNumber()
  if (explicit) return explicit

  const branchResult = runSafe('git branch --show-current')
  if (branchResult.status !== 0) {
    logError('Failed to determine current git branch.')
    process.exit(1)
  }

  const branch = branchResult.stdout
  const match = branch.match(/(?:feat|fix|hotfix)\/(\d+)/)
  if (!match) {
    logError(
      `Cannot extract issue number from branch '${branch}'. ` +
        'Use an explicit issue number: tsx scripts/db-branch.ts create <number>'
    )
    process.exit(1)
  }

  return match[1]
}

/** Check that the Postgres container is alive and accepting connections. */
function checkContainerLiveness(): void {
  const result = runSafe(`docker exec ${CONTAINER_NAME} pg_isready -U ${POSTGRES_USER}`)
  if (result.status !== 0) {
    logError(
      `Postgres container is not running. Run 'bun run db:up' from the project root first.\n  ${result.stderr}`
    )
    process.exit(1)
  }
}

/** Check if a database exists in the container. */
function databaseExists(dbName: string): boolean {
  const result = runSafe(
    `docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -tc "SELECT 1 FROM pg_database WHERE datname = '${dbName}'"`
  )
  return result.status === 0 && result.stdout.trim() === '1'
}

/** Drop a database inside the container. */
function dropDatabase(dbName: string): void {
  const result = runSafe(
    `docker exec ${CONTAINER_NAME} dropdb -U ${POSTGRES_USER} --if-exists ${dbName}`
  )
  if (result.status !== 0) {
    logError(`Failed to drop database '${dbName}': ${result.stderr}`)
    process.exit(1)
  }
}

/** Create a database inside the container. */
function createDatabase(dbName: string): void {
  const result = runSafe(`docker exec ${CONTAINER_NAME} createdb -U ${POSTGRES_USER} ${dbName}`)
  if (result.status !== 0) {
    logError(`Failed to create database '${dbName}': ${result.stderr}`)
    process.exit(1)
  }
}

/** Build the DATABASE_URL for a branch database. */
function buildDatabaseUrl(dbName: string): string {
  return buildDatabaseUrlUtil(dbName, POSTGRES_USER, POSTGRES_PASSWORD)
}

/**
 * Find the worktree root by walking up from apps/api/ (the script's working directory)
 * looking for the .env file.
 */
function findWorktreeRoot(): string {
  // Start from the directory containing this script, then walk up
  let dir = process.cwd()
  const root = path.parse(dir).root

  while (dir !== root) {
    // Check for .git file or directory (indicates repo/worktree root)
    const gitPath = path.join(dir, '.git')
    if (fs.existsSync(gitPath)) {
      return dir
    }
    dir = path.dirname(dir)
  }

  logError('Could not determine worktree root.')
  process.exit(1)
}

/** Build the DATABASE_APP_URL for a branch database using the roxabi_app user. */
function buildAppDatabaseUrl(dbName: string): string {
  const appUser = process.env.POSTGRES_APP_USER ?? 'roxabi_app'
  const appPassword = process.env.POSTGRES_APP_PASSWORD ?? 'roxabi_app'
  return buildDatabaseUrlUtil(dbName, appUser, appPassword)
}

/** Update the .env file at the worktree root to use the branch DATABASE_URL and DATABASE_APP_URL. */
function updateEnvFile(databaseUrl: string): void {
  const root = findWorktreeRoot()
  const envPath = path.join(root, '.env')

  if (!fs.existsSync(envPath)) {
    logError(`No .env file found at ${envPath}. Run 'cp .env.example .env' first.`)
    process.exit(1)
  }

  const content = fs.readFileSync(envPath, 'utf-8')
  const lines = content.split('\n')
  let replacedUrl = false
  let replacedAppUrl = false

  // Derive the app URL from the owner URL by substituting the user/password
  const dbName = databaseUrl.split('/').pop() ?? ''
  const appUrl = buildAppDatabaseUrl(dbName)

  const updatedLines = lines.map((line) => {
    if (/^DATABASE_URL\s*=/.test(line)) {
      replacedUrl = true
      return `DATABASE_URL=${databaseUrl}`
    }
    if (/^DATABASE_APP_URL\s*=/.test(line)) {
      replacedAppUrl = true
      return `DATABASE_APP_URL=${appUrl}`
    }
    return line
  })

  if (!replacedUrl) {
    updatedLines.push(`DATABASE_URL=${databaseUrl}`)
  }
  if (!replacedAppUrl) {
    updatedLines.push(`DATABASE_APP_URL=${appUrl}`)
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf-8')
  log(`Updated ${envPath} with DATABASE_URL=${redactUrl(databaseUrl)}`)
  log(`Updated ${envPath} with DATABASE_APP_URL=${redactUrl(appUrl)}`)
}

/**
 * Resolve the apps/api directory for running bun scripts.
 * The script may already be running from apps/api/ or from the worktree root.
 */
function resolveApiDir(): string {
  const cwd = process.cwd()
  // If we are already in apps/api
  if (path.basename(cwd) === 'api' && path.basename(path.dirname(cwd)) === 'apps') {
    return cwd
  }
  // Otherwise, assume worktree root
  const apiDir = path.join(cwd, 'apps', 'api')
  if (fs.existsSync(apiDir)) {
    return apiDir
  }
  // Walk up to find worktree root, then descend
  const root = findWorktreeRoot()
  const fromRoot = path.join(root, 'apps', 'api')
  if (fs.existsSync(fromRoot)) {
    return fromRoot
  }
  logError('Cannot locate apps/api/ directory.')
  process.exit(1)
}

/** Run SQL against a database in the container via piped stdin. */
function runSql(dbName: string, sql: string): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(
    'docker',
    ['exec', '-i', CONTAINER_NAME, 'psql', '-U', POSTGRES_USER, '-d', dbName],
    {
      input: sql,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }
  )
  return {
    status: result.status ?? 1,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  }
}

/**
 * Stamp all journal entries into drizzle.__drizzle_migrations.
 *
 * After `drizzle-kit push` creates the schema, the migration tracker is empty.
 * This reads the journal, computes SHA-256 hashes (matching Drizzle's own format),
 * and inserts records so `checkPendingMigrations()` sees all migrations as applied.
 */
function stampMigrations(dbName: string, apiDir: string): void {
  const journalPath = path.join(apiDir, 'drizzle', 'migrations', 'meta', '_journal.json')
  if (!fs.existsSync(journalPath)) {
    log('No migration journal found — skipping stamp.')
    return
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8')) as {
    entries?: { tag: string; when: number }[]
  }
  const entries = journal.entries ?? []
  if (entries.length === 0) {
    log('No migrations to stamp.')
    return
  }

  const values: string[] = []
  for (const entry of entries) {
    const sqlPath = path.join(apiDir, 'drizzle', 'migrations', `${entry.tag}.sql`)
    const content = fs.readFileSync(sqlPath, 'utf-8')
    const hash = crypto.createHash('sha256').update(content).digest('hex')
    values.push(`('${hash}', ${entry.when})`)
  }

  const stampSql = `
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id serial PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
      ${values.join(',\n      ')};
  `

  log(`Stamping ${entries.length} migration(s)...`)
  const result = runSql(dbName, stampSql)
  if (result.status !== 0) {
    throw new Error(`Failed to stamp migrations: ${result.stderr}`)
  }
  log(`Stamped ${entries.length} migration(s).`)
}

/**
 * Apply RLS policies to all tenant-scoped tables.
 *
 * `drizzle-kit push` creates table structures but skips custom SQL in migrations.
 * This queries the database for tables with a `tenant_id` column and applies
 * the `create_tenant_rls_policy()` helper to each one (idempotent).
 */
function applyRlsPolicies(dbName: string): void {
  log('Applying RLS policies to tenant-scoped tables...')

  const policySql = `
    DO $$
    DECLARE
      tbl text;
    BEGIN
      FOR tbl IN
        SELECT c.table_name
        FROM information_schema.columns c
        WHERE c.column_name = 'tenant_id'
          AND c.table_schema = 'public'
          -- Skip tables that already have RLS enabled
          AND NOT EXISTS (
            SELECT 1 FROM pg_class pc
            WHERE pc.relname = c.table_name
              AND pc.relrowsecurity = true
          )
      LOOP
        PERFORM create_tenant_rls_policy(tbl);
      END LOOP;
    END;
    $$;
  `

  const result = runSql(dbName, policySql)
  if (result.status !== 0) {
    log(`Warning: RLS policy application returned non-zero: ${result.stderr}`)
  } else {
    log('RLS policies applied.')
  }
}

/**
 * Grant the roxabi_app user permissions on a branch database.
 *
 * The roxabi_app role is a cluster-level role created by Docker's init script
 * (or by `db:setup-app-user`). Branch databases need per-database grants.
 */
function setupAppUserForBranch(dbName: string): void {
  const appUser = process.env.POSTGRES_APP_USER ?? 'roxabi_app'

  log(`Granting permissions to '${appUser}' on '${dbName}'...`)

  const grantSql = `
    -- Grant connect and schema usage
    GRANT CONNECT ON DATABASE "${dbName}" TO ${appUser};
    GRANT USAGE ON SCHEMA public TO ${appUser};

    -- Grant DML on all tables and sequences
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${appUser};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${appUser};

    -- Ensure future tables/sequences also get permissions
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appUser};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${appUser};

    -- Grant drizzle schema access
    CREATE SCHEMA IF NOT EXISTS drizzle;
    GRANT USAGE ON SCHEMA drizzle TO ${appUser};
    GRANT SELECT ON ALL TABLES IN SCHEMA drizzle TO ${appUser};
    ALTER DEFAULT PRIVILEGES IN SCHEMA drizzle GRANT SELECT ON TABLES TO ${appUser};
  `

  const result = runSql(dbName, grantSql)
  if (result.status !== 0) {
    // Non-fatal: the app user may not exist yet (e.g., fresh Docker setup before init ran)
    log(`Warning: Failed to grant permissions to '${appUser}': ${result.stderr}`)
    log(
      "If roxabi_app doesn't exist yet, run: cd apps/api && bun run db:setup-app-user"
    )
  } else {
    log(`Permissions granted to '${appUser}'.`)
  }
}

/**
 * Set up the branch database schema.
 *
 * Branch DBs use `drizzle-kit push` (not `db:migrate`) because there is no
 * initial migration that creates the base tables — migrations are incremental
 * ALTERs on top of a schema that was originally created via push.
 *
 * After push:
 * 1. Apply RLS infrastructure (roles/functions/grants not part of the Drizzle schema)
 * 2. Stamp all migrations as applied so `checkPendingMigrations()` is satisfied
 */
function runMigrations(databaseUrl: string, dbName: string): void {
  const apiDir = resolveApiDir()

  // Step 1: Push schema to create/sync tables
  log('Pushing schema...')
  const pushResult = spawnSync(
    'bunx',
    ['tsx', 'node_modules/drizzle-kit/bin.cjs', 'push', '--force'],
    {
      cwd: apiDir,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    }
  )
  if (pushResult.status !== 0) {
    throw new Error(`Schema push failed with exit code ${pushResult.status}`)
  }
  log('Schema pushed.')

  // Step 2: Apply RLS infrastructure (roles, functions, grants — not handled by push)
  const rlsPath = path.join(apiDir, 'drizzle', 'migrations', '0000_rls_infrastructure.sql')
  if (fs.existsSync(rlsPath)) {
    log('Applying RLS infrastructure...')
    const rlsSql = fs.readFileSync(rlsPath, 'utf-8')
    const rlsResult = runSql(dbName, rlsSql)
    if (rlsResult.status !== 0) {
      log(`Warning: RLS infrastructure returned non-zero: ${rlsResult.stderr}`)
    }
  }

  // Step 2a: Apply RLS policies to tenant-scoped tables
  // drizzle-kit push creates tables but not RLS policies (those live in custom SQL migrations).
  // We call the helper function for each table that has a tenant_id column.
  applyRlsPolicies(dbName)

  // Step 2b: Set up roxabi_app user permissions on the branch database
  setupAppUserForBranch(dbName)

  // Step 3: Stamp all migrations as applied
  stampMigrations(dbName, apiDir)

  log('Database setup completed.')
}

/** Run seed against the branch database. */
function runSeed(databaseUrl: string): void {
  const apiDir = resolveApiDir()
  log('Running seed...')
  const result = spawnSync('bun', ['run', 'db:seed'], {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(`Seed failed with exit code ${result.status}`)
  }
  log('Seed completed.')
}

/** Prompt the user interactively. Returns the answer string. */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// ---------------------------------------------------------------------------
// Subcommand: create
// ---------------------------------------------------------------------------

async function handleCreate(): Promise<void> {
  const issueNumber = extractIssueNumber()
  const dbName = `roxabi_${issueNumber}`

  if (!/^roxabi_\d+$/.test(dbName)) {
    logError(`Invalid database name: '${dbName}'`)
    process.exit(1)
  }

  log(`Creating branch database '${dbName}'...`)

  // Step 1: Check container liveness
  checkContainerLiveness()

  // Step 2: Check if database already exists
  if (databaseExists(dbName)) {
    if (forceFlag) {
      log(`Database '${dbName}' already exists. --force specified, dropping and recreating...`)
      dropDatabase(dbName)
    } else if (process.stdin.isTTY) {
      const answer = await prompt(
        `[db-branch] Database '${dbName}' already exists. Recreate? (y/N) `
      )
      if (answer === 'y' || answer === 'yes') {
        log(`Dropping existing database '${dbName}'...`)
        dropDatabase(dbName)
      } else {
        log('Skipping database creation.')
        return
      }
    } else {
      logError(`Database '${dbName}' already exists. Use --force to recreate or run interactively.`)
      process.exit(1)
    }
  }

  // Step 3: Create the database
  createDatabase(dbName)
  log(`Database '${dbName}' created.`)

  const databaseUrl = buildDatabaseUrl(dbName)

  // Steps 4-5: Push schema, stamp migrations, and seed, with cleanup on failure
  try {
    runMigrations(databaseUrl, dbName)
    runSeed(databaseUrl)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logError(`${message}`)
    log(`Cleaning up: dropping database '${dbName}'...`)
    dropDatabase(dbName)
    process.exit(1)
  }

  // Step 6: Update .env
  updateEnvFile(databaseUrl)

  log(`Branch database '${dbName}' is ready.`)
  log(`DATABASE_URL=${redactUrl(databaseUrl)}`)
}

// ---------------------------------------------------------------------------
// Subcommand: drop
// ---------------------------------------------------------------------------

function handleDrop(): void {
  const issueNumber = extractIssueNumber()
  const dbName = `roxabi_${issueNumber}`

  if (!/^roxabi_\d+$/.test(dbName)) {
    logError(`Invalid database name: '${dbName}'`)
    process.exit(1)
  }

  checkContainerLiveness()

  log(`Dropping database '${dbName}'...`)
  dropDatabase(dbName)
  log(`Database '${dbName}' dropped.`)
}

// ---------------------------------------------------------------------------
// Subcommand: list
// ---------------------------------------------------------------------------

function parseWorktrees(): WorktreeInfo[] {
  const result = runSafe('git worktree list --porcelain')
  if (result.status !== 0) return []

  return result.stdout
    .split('\n\n')
    .map(parseWorktreeBlock)
    .filter((wt): wt is WorktreeInfo => wt !== null)
}

function handleList(): void {
  checkContainerLiveness()

  // Query branch databases
  const dbResult = runSafe(
    `docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -tc "SELECT datname FROM pg_database WHERE datname ~ '^roxabi_[0-9]+$'"`
  )
  if (dbResult.status !== 0) {
    logError(`Failed to query databases: ${dbResult.stderr}`)
    process.exit(1)
  }

  const databases = dbResult.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (databases.length === 0) {
    log('No branch databases found.')
    return
  }

  // Get active worktrees
  const worktrees = parseWorktrees()

  // Build a map: issue number -> worktree info
  const worktreeByIssue = new Map<string, WorktreeInfo>()
  for (const wt of worktrees) {
    if (wt.issueNumber) {
      worktreeByIssue.set(wt.issueNumber, wt)
    }
  }

  // Determine column widths
  const header = { db: 'Database', wt: 'Worktree', branch: 'Branch', status: 'Status' }
  const rows: { db: string; wt: string; branch: string; status: string }[] = []

  for (const db of databases) {
    const issueMatch = db.match(/^roxabi_(\d+)$/)
    const issueNumber = issueMatch ? issueMatch[1] : null
    const wt = issueNumber ? worktreeByIssue.get(issueNumber) : undefined

    if (wt) {
      // Make path relative for readability
      const cwd = process.cwd()
      const relPath = path.relative(cwd, wt.path) || wt.path
      rows.push({
        db,
        wt: relPath,
        branch: wt.branch,
        status: '\u2713 Active',
      })
    } else {
      rows.push({
        db,
        wt: '\u2014',
        branch: '\u2014',
        status: '\u26A0 Orphan',
      })
    }
  }

  // Calculate column widths
  const colDb = Math.max(header.db.length, ...rows.map((r) => r.db.length))
  const colWt = Math.max(header.wt.length, ...rows.map((r) => r.wt.length))
  const colBranch = Math.max(header.branch.length, ...rows.map((r) => r.branch.length))
  const colStatus = Math.max(header.status.length, ...rows.map((r) => r.status.length))

  const pad = (s: string, len: number) => s.padEnd(len)
  const sep = '\u2502'

  // Print table
  console.log(
    `${pad(header.db, colDb)} ${sep} ${pad(header.wt, colWt)} ${sep} ${pad(header.branch, colBranch)} ${sep} ${header.status}`
  )
  console.log(
    `${'\u2500'.repeat(colDb + 1)}${'\u253C'}${'\u2500'.repeat(colWt + 2)}${'\u253C'}${'\u2500'.repeat(colBranch + 2)}${'\u253C'}${'\u2500'.repeat(colStatus + 1)}`
  )
  for (const row of rows) {
    console.log(
      `${pad(row.db, colDb)} ${sep} ${pad(row.wt, colWt)} ${sep} ${pad(row.branch, colBranch)} ${sep} ${row.status}`
    )
  }

  log(`Found ${databases.length} branch database(s).`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  switch (subcommand) {
    case 'create':
      await handleCreate()
      break
    case 'drop':
      handleDrop()
      break
    case 'list':
      handleList()
      break
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  logError(message)
  process.exit(1)
})
