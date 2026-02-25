import { execFileSync } from 'node:child_process'
import path from 'node:path'

/**
 * Playwright global setup — ensures the database is migrated and seeded
 * before E2E tests run.
 *
 * Runs: db:migrate → db:seed (seed failures from duplicate keys are ignored,
 * meaning an already-seeded DB is fine).
 */
export default function globalSetup() {
  const root = path.resolve(import.meta.dirname, '../../..')
  const opts = { cwd: root, stdio: 'pipe' as const }

  console.log('[e2e] Running database migrations…')
  execFileSync('bun', ['run', 'db:migrate'], opts)

  console.log('[e2e] Seeding database…')
  try {
    execFileSync('bun', ['run', 'db:seed'], opts)
    console.log('[e2e] Database seeded successfully.')
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? ''
    if (stderr.includes('duplicate key') || stderr.includes('already contains data')) {
      console.log('[e2e] Database already seeded, skipping.')
    } else {
      console.error('[e2e] Seed failed:', stderr)
      throw error
    }
  }
}
