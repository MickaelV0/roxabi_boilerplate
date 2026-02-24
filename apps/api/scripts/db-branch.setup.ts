import { spawnSync } from 'node:child_process'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { log, resolveApiDir, runSql } from './db-branch.helpers.js'

/**
 * Stamp all journal entries into drizzle.__drizzle_migrations.
 *
 * After `drizzle-kit push` creates the schema, the migration tracker is empty.
 * This reads the journal, computes SHA-256 hashes (matching Drizzle's own format),
 * and inserts records so `checkPendingMigrations()` sees all migrations as applied.
 */
export function stampMigrations(dbName: string, apiDir: string): void {
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
export function applyRlsPolicies(dbName: string): void {
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
export function setupAppUserForBranch(dbName: string): void {
  const appUser = process.env.POSTGRES_APP_USER ?? 'roxabi_app'

  // Validate app user to prevent SQL injection in interpolated SQL strings
  const IDENTIFIER_REGEX = /^[a-z_][a-z0-9_]*$/
  if (!IDENTIFIER_REGEX.test(appUser)) {
    throw new Error(`Invalid POSTGRES_APP_USER: "${appUser}" — must match /^[a-z_][a-z0-9_]*$/`)
  }

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

    -- Grant app_user role so SET LOCAL ROLE app_user works at runtime
    GRANT app_user TO ${appUser};

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
    log("If roxabi_app doesn't exist yet, run: cd apps/api && bun run db:setup-app-user")
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
export function runMigrations(databaseUrl: string, dbName: string): void {
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

  // Step 2a-bis: Grant app_user to current_user so SET LOCAL ROLE works
  const grantRoleSql = `GRANT app_user TO current_user;`
  const grantRoleResult = runSql(dbName, grantRoleSql)
  if (grantRoleResult.status !== 0) {
    log(`Warning: GRANT app_user TO current_user returned non-zero: ${grantRoleResult.stderr}`)
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
export function runSeed(databaseUrl: string): void {
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
