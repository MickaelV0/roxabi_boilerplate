/**
 * Seed script — inserts dev essentials into a fresh database.
 *
 * Designed for fresh databases only (not idempotent).
 * For re-seeding, drop and recreate the database (db:branch:create --force).
 *
 * Presets:
 *   minimal (default) — 3 users, 2 orgs, basic RBAC
 *   full              — 12 users, 4 orgs, invitations, cross-org members
 *
 * Usage:
 *   DATABASE_URL=postgresql://... tsx scripts/db-seed.ts
 *   DATABASE_URL=postgresql://... tsx scripts/db-seed.ts --preset=full
 *   bun run db:seed  (reads DATABASE_URL from .env)
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/database/schema/index.js'
import { type Preset, runFixtures } from './fixtures/index.js'

const VALID_PRESETS: Preset[] = ['minimal', 'full']

function parsePreset(): Preset {
  const presetArg = process.argv.find((a) => a.startsWith('--preset='))
  const preset = presetArg ? presetArg.split('=')[1] : 'minimal'
  if (!VALID_PRESETS.includes(preset as Preset)) {
    console.error(`db-seed: unknown preset "${preset}". Available: ${VALID_PRESETS.join(', ')}`)
    process.exit(1)
  }
  return preset as Preset
}

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('db-seed: DATABASE_URL environment variable is required')
    process.exit(1)
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('db-seed: refusing to run in production (NODE_ENV=production)')
    process.exit(1)
  }

  const preset = parsePreset()
  console.log(`db-seed: using preset "${preset}"`)

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client, { schema })

  try {
    await runFixtures(db, preset)
  } catch (error) {
    console.error('db-seed: failed to seed database:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
