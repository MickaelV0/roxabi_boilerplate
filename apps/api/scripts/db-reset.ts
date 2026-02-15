/**
 * Reset script — truncates all application tables in the database.
 *
 * Designed for development and testing environments only.
 * Refuses to run when NODE_ENV=production.
 *
 * Truncated tables (in dependency order via CASCADE):
 *   role_permissions, roles, permissions, invitations, members,
 *   sessions, accounts, verifications, organizations, users
 *
 * Usage:
 *   DATABASE_URL=postgresql://... tsx scripts/db-reset.ts
 *   bun run db:reset  (reads DATABASE_URL from .env)
 */

import postgres from 'postgres'

const TABLES = [
  'role_permissions',
  'roles',
  'permissions',
  'invitations',
  'members',
  'sessions',
  'accounts',
  'verifications',
  'organizations',
  'users',
] as const

async function reset() {
  if (process.env.NODE_ENV === 'production') {
    console.error('db-reset: refusing to run in production (NODE_ENV=production)')
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('db-reset: DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const client = postgres(databaseUrl, { max: 1 })

  try {
    const tableList = TABLES.map((t) => `"${t}"`).join(', ')
    await client.unsafe(`TRUNCATE ${tableList} CASCADE`)
    console.log(`Reset: truncated ${TABLES.length} tables`)
  } catch (error) {
    console.error('db-reset: failed to reset database:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

reset()
