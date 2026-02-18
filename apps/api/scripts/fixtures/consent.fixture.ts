import * as schema from '../../src/database/schema/index.js'
import type { FixtureContext, Preset, Tx } from './types.js'

/** Create one consent record per user. */
export async function seed(tx: Tx, _preset: Preset, ctx: FixtureContext): Promise<number> {
  for (const userId of ctx.userIds) {
    await tx.insert(schema.consentRecords).values({
      id: crypto.randomUUID(),
      userId,
      categories: { analytics: true, marketing: false, functional: true },
      policyVersion: '1.0',
      action: 'accepted',
      ipAddress: '127.0.0.1',
      userAgent: 'roxabi-seed/1.0',
    })
  }
  return ctx.userIds.length
}
