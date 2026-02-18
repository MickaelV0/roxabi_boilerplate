import * as schema from '../../src/database/schema/index.js'
import type { FixtureContext, Preset, SeedResult, Tx } from './types.js'

/** Create one consent record per user. */
export async function seed(tx: Tx, _preset: Preset, ctx: FixtureContext): Promise<SeedResult> {
  for (const userId of ctx.userIds) {
    await tx.insert(schema.consentRecords).values({
      id: crypto.randomUUID(),
      userId,
      categories: { analytics: true, marketing: false, functional: true },
      policyVersion: '1.0',
      action: 'accepted',
      ipAddress: '0.0.0.0',
      userAgent: 'roxabi-seed/1.0',
    })
  }
  return { consentCount: ctx.userIds.length }
}
