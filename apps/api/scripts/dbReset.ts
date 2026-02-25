/**
 * Reset script — truncates all application tables in the database.
 *
 * Designed for development and testing environments only.
 * Refuses to run when NODE_ENV=production.
 *
 * Truncated tables (in dependency order via CASCADE):
 *   consent_records, role_permissions, roles, permissions, invitations,
 *   members, sessions, accounts, verifications, organizations, users
 *
 * Usage:
 *   DATABASE_URL=postgresql://... tsx scripts/dbReset.ts
 *   bun run db:reset  (reads DATABASE_URL from .env)
 */

import postgres from 'postgres'
import { assertNotProduction, requireDatabaseUrl } from './guards.js'

const TABLES = [
  'consent_records',
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
  assertNotProduction('db-reset')
  const databaseUrl = requireDatabaseUrl('db-reset')

  const client = postgres(databaseUrl, { max: 1 })

  try {
    const tableList = TABLES.map((t) => `"${t}"`).join(', ')
    try {
      await client.unsafe(`TRUNCATE ${tableList} CASCADE`)
    } catch (truncateError) {
      const message = truncateError instanceof Error ? truncateError.message : String(truncateError)
      if (message.includes('does not exist') || message.includes('relation')) {
        console.error(
          "db-reset: one or more tables do not exist. Run 'bun run db:migrate' first to create them."
        )
      }
      throw truncateError
    }
    console.log(`Reset: truncated ${TABLES.length} tables`)
  } catch (error) {
    console.error('db-reset: failed to reset database:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

reset()
