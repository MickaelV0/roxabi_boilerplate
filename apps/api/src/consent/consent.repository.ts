import type { ConsentRecord } from '@repo/types'
import type { DrizzleTx } from '../database/drizzle.provider.js'
import type { SaveConsentDto } from './consent.service.js'

export const CONSENT_REPO = Symbol('CONSENT_REPO')

export interface ConsentRepository {
  saveConsent(userId: string, dto: SaveConsentDto, tx?: DrizzleTx): Promise<ConsentRecord>
  getLatestByUserId(userId: string, tx?: DrizzleTx): Promise<ConsentRecord>
}
