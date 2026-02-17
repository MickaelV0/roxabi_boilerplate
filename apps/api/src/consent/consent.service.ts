import { Inject, Injectable } from '@nestjs/common'
import type { ConsentRecord } from '@repo/types'
import { desc, eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { consentRecords } from '../database/schema/consent.schema.js'

export interface SaveConsentDto {
  categories: { necessary: true; analytics: boolean; marketing: boolean }
  policyVersion: string
  action: 'accepted' | 'rejected' | 'customized'
  ipAddress?: string | null
  userAgent?: string | null
}

function toConsentRecord(row: typeof consentRecords.$inferSelect): ConsentRecord {
  return {
    id: row.id,
    userId: row.userId,
    categories: row.categories as ConsentRecord['categories'],
    policyVersion: row.policyVersion,
    action: row.action as ConsentRecord['action'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

@Injectable()
export class ConsentService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async saveConsent(userId: string, dto: SaveConsentDto): Promise<ConsentRecord> {
    const rows = await this.db
      .insert(consentRecords)
      .values({
        userId,
        categories: dto.categories,
        policyVersion: dto.policyVersion,
        action: dto.action,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
      })
      .returning()

    const row = rows[0]
    if (!row) {
      throw new Error('Insert did not return a row')
    }
    return toConsentRecord(row)
  }

  async getLatestConsent(userId: string): Promise<ConsentRecord | null> {
    const [row] = await this.db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userId, userId))
      .orderBy(desc(consentRecords.createdAt))
      .limit(1)

    if (!row) return null
    return toConsentRecord(row)
  }
}
