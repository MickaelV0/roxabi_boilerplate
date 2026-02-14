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

import { execSync, spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const POSTGRES_USER = process.env.POSTGRES_USER ?? 'roxabi'
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'roxabi'
const POSTGRES_DB = process.env.POSTGRES_DB ?? 'roxabi'
const CONTAINER_NAME = 'roxabi-postgres'

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const subcommand = args[0]

if (!subcommand || !['create', 'drop', 'list'].includes(subcommand)) {
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
  return undefined
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
    logError(`Postgres container is not running. Run 'bun run db:up' first.\n  ${result.stderr}`)
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
  return `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${dbName}`
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

  // Fallback: if cwd is apps/api, go two levels up
  const fallback = path.resolve(process.cwd(), '..', '..')
  if (fs.existsSync(path.join(fallback, '.git'))) {
    return fallback
  }

  logError('Could not determine worktree root.')
  process.exit(1)
}

/** Update the .env file at the worktree root to use the branch DATABASE_URL. */
function updateEnvFile(databaseUrl: string): void {
  const root = findWorktreeRoot()
  const envPath = path.join(root, '.env')

  if (!fs.existsSync(envPath)) {
    logError(`No .env file found at ${envPath}. Run 'cp .env.example .env' first.`)
    process.exit(1)
  }

  const content = fs.readFileSync(envPath, 'utf-8')
  const lines = content.split('\n')
  let replaced = false

  const updatedLines = lines.map((line) => {
    if (/^DATABASE_URL=/.test(line)) {
      replaced = true
      return `DATABASE_URL=${databaseUrl}`
    }
    return line
  })

  if (!replaced) {
    // DATABASE_URL line not found — append it
    updatedLines.push(`DATABASE_URL=${databaseUrl}`)
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf-8')
  log(`Updated ${envPath} with DATABASE_URL=${databaseUrl}`)
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

/** Run migrations against the branch database. */
function runMigrations(databaseUrl: string): void {
  const apiDir = resolveApiDir()
  log('Running migrations...')
  const result = spawnSync('bun', ['run', 'db:migrate'], {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(`Migration failed with exit code ${result.status}`)
  }
  log('Migrations completed.')
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

  // Steps 4-5: Run migrations and seed, with cleanup on failure
  try {
    runMigrations(databaseUrl)
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
  log(`DATABASE_URL=${databaseUrl}`)
}

// ---------------------------------------------------------------------------
// Subcommand: drop
// ---------------------------------------------------------------------------

function handleDrop(): void {
  const issueNumber = extractIssueNumber()
  const dbName = `roxabi_${issueNumber}`

  // Safety guard: refuse to drop the default database
  if (dbName === POSTGRES_DB) {
    logError(
      `Cannot drop the default database '${POSTGRES_DB}'. Only branch databases (roxabi_NNN) can be dropped.`
    )
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

interface WorktreeInfo {
  path: string
  branch: string
  issueNumber: string | null
}

/** Parse a single porcelain worktree block into a WorktreeInfo, or null if incomplete. */
function parseWorktreeBlock(block: string): WorktreeInfo | null {
  const lines = block.split('\n')
  let wtPath = ''
  let branch = ''

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      wtPath = line.replace('worktree ', '')
    }
    if (line.startsWith('branch ')) {
      branch = line.replace('branch refs/heads/', '')
    }
  }

  if (!wtPath || !branch) return null

  const match = branch.match(/(?:feat|fix|hotfix)\/(\d+)/)
  return {
    path: wtPath,
    branch,
    issueNumber: match ? match[1] : null,
  }
}

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
