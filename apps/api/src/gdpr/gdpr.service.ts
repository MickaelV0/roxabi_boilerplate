import { Inject, Injectable } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'

export interface GdprExportData {
  user: Record<string, unknown>
  sessions: Record<string, unknown>[]
  accounts: Record<string, unknown>[]
  organizations: Record<string, unknown>[]
  invitations: Record<string, unknown>[]
  consentRecords: Record<string, unknown>[]
  exportedAt: string
}

@Injectable()
export class GdprService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async exportUserData(userId: string): Promise<GdprExportData> {
    // TODO: implement
    // Must query the following tables:
    // - users (EXCLUDE: password-related fields)
    // - sessions (EXCLUDE: token)
    // - accounts (EXCLUDE: accessToken, refreshToken, idToken, password)
    // - organizations (via members table join)
    // - invitations (where email matches user email)
    // - consentRecords (EXCLUDE: ipAddress, userAgent)
    //
    // Must NOT include:
    // - passwords, OAuth tokens, session tokens, verification tokens
    // - ip_address and user_agent from consent_records
    //
    // Must work for soft-deleted users (do not filter by deleted_at)
    throw new Error('Not implemented')
  }
}
