import { Inject, Injectable } from '@nestjs/common'
import type { ConsentRecord } from '@repo/types'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'

export interface SaveConsentDto {
  categories: { necessary: true; analytics: boolean; marketing: boolean }
  policyVersion: string
  action: 'accepted' | 'rejected' | 'customized'
  ipAddress?: string | null
  userAgent?: string | null
}

@Injectable()
export class ConsentService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async saveConsent(userId: string, dto: SaveConsentDto): Promise<ConsentRecord> {
    // TODO: implement
    // - Insert into consentRecords table
    // - Return the created record
    throw new Error('Not implemented')
  }

  async getLatestConsent(userId: string): Promise<ConsentRecord | null> {
    // TODO: implement
    // - Query consentRecords for the given userId
    // - Order by createdAt DESC, limit 1
    // - Return null if no record found
    throw new Error('Not implemented')
  }
}
