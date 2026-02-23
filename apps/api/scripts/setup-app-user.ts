/**
 * Creates the roxabi_app application user on an existing database.
 *
 * This script is for databases that were created BEFORE the Docker init script
 * was added. For new databases, the Docker init script handles this automatically.
 *
 * The roxabi_app user:
 * - Has LOGIN + NOBYPASSRLS so RLS policies are enforced
 * - Gets SELECT, INSERT, UPDATE, DELETE on all public tables
 * - Gets SELECT on drizzle schema (for migration status checks)
 * - Is used by the NestJS application at runtime (via DATABASE_APP_URL)
 *
 * Usage:
 *   DATABASE_URL=postgresql://roxabi:roxabi@localhost:5432/roxabi tsx scripts/setup-app-user.ts
 *   bun run db:setup-app-user  (reads DATABASE_URL from .env)
 */

import postgres from 'postgres'
import { assertNotProduction, requireDatabaseUrl } from './guards.js'

const APP_USER = process.env.POSTGRES_APP_USER ?? 'roxabi_app'
const APP_PASSWORD = process.env.POSTGRES_APP_PASSWORD ?? 'roxabi_app'

// Validate credentials to prevent SQL injection in interpolated SQL strings
const IDENTIFIER_REGEX = /^[a-z_][a-z0-9_]*$/
if (!IDENTIFIER_REGEX.test(APP_USER)) {
  throw new Error(`Invalid APP_USER: "${APP_USER}" — must match /^[a-z_][a-z0-9_]*$/`)
}
if (APP_PASSWORD.includes("'")) {
  throw new Error('APP_PASSWORD must not contain single quotes')
}

async function setupAppUser() {
  assertNotProduction('setup-app-user')
  const databaseUrl = requireDatabaseUrl('setup-app-user')

  const client = postgres(databaseUrl, { max: 1 })

  try {
    console.log(`[setup-app-user] Creating application user '${APP_USER}'...`)

    // Create the login role (idempotent)
    await client.unsafe(`
      DO $$
      BEGIN
        CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}' NOBYPASSRLS;
      EXCEPTION
        WHEN duplicate_object THEN
          ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}' NOBYPASSRLS;
      END
      $$
    `)

    // Grant connect on the current database
    const dbNameResult = await client`SELECT current_database() AS db_name`
    const dbName = dbNameResult[0].db_name as string
    await client.unsafe(`GRANT CONNECT ON DATABASE "${dbName}" TO ${APP_USER}`)

    // Grant schema usage and DML on all public tables
    await client.unsafe(`GRANT USAGE ON SCHEMA public TO ${APP_USER}`)
    await client.unsafe(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER}`
    )

    // Grant sequence usage (for serial/identity columns)
    await client.unsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER}`)

    // Ensure future tables and sequences also get permissions
    await client.unsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_USER}`
    )
    await client.unsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_USER}`
    )

    // Grant drizzle schema access (for migration status checks at startup)
    await client.unsafe('CREATE SCHEMA IF NOT EXISTS drizzle')
    await client.unsafe(`GRANT USAGE ON SCHEMA drizzle TO ${APP_USER}`)
    await client.unsafe(`GRANT SELECT ON ALL TABLES IN SCHEMA drizzle TO ${APP_USER}`)
    await client.unsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA drizzle GRANT SELECT ON TABLES TO ${APP_USER}`
    )

    // Grant app_user role so SET LOCAL ROLE app_user works
    // (matches docker/init-app-user.sh behavior)
    try {
      await client.unsafe(`GRANT app_user TO ${APP_USER}`)
    } catch (err) {
      // app_user role may not exist yet if migrations haven't run (0000_rls_infrastructure creates it)
      console.warn(
        `[setup-app-user] Could not grant app_user role to ${APP_USER} (role may not exist yet):`,
        err instanceof Error ? err.message : err
      )
    }

    console.log(`[setup-app-user] Application user '${APP_USER}' created successfully.`)
    console.log(
      `[setup-app-user] Set DATABASE_APP_URL=postgresql://${APP_USER}:${APP_PASSWORD}@localhost:5432/${dbName} in your .env`
    )
  } catch (error) {
    console.error('[setup-app-user] Failed to create application user:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

setupAppUser()
