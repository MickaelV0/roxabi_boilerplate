import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  users,
} from '../database/schema/auth.schema.js'
import { consentRecords } from '../database/schema/consent.schema.js'

export interface GdprExportData {
  exportedAt: string
  user: Record<string, unknown>
  sessions: Record<string, unknown>[]
  accounts: Record<string, unknown>[]
  organizations: Record<string, unknown>[]
  invitations: Record<string, unknown>[]
  consent: Record<string, unknown>[]
}

@Injectable()
export class GdprService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async exportUserData(userId: string): Promise<GdprExportData> {
    const [userData, sessionData, accountData, orgData, consentData] = await Promise.all([
      this.db
        .select({
          name: users.name,
          email: users.email,
          image: users.image,
          role: users.role,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      this.db
        .select({
          ipAddress: sessions.ipAddress,
          userAgent: sessions.userAgent,
          createdAt: sessions.createdAt,
          expiresAt: sessions.expiresAt,
        })
        .from(sessions)
        .where(eq(sessions.userId, userId)),

      this.db
        .select({
          providerId: accounts.providerId,
          scope: accounts.scope,
          createdAt: accounts.createdAt,
        })
        .from(accounts)
        .where(eq(accounts.userId, userId)),

      this.db
        .select({
          name: organizations.name,
          role: members.role,
          joinedAt: members.createdAt,
        })
        .from(members)
        .innerJoin(organizations, eq(members.organizationId, organizations.id))
        .where(eq(members.userId, userId)),

      this.db
        .select({
          categories: consentRecords.categories,
          action: consentRecords.action,
          consentedAt: consentRecords.createdAt,
          policyVersion: consentRecords.policyVersion,
        })
        .from(consentRecords)
        .where(eq(consentRecords.userId, userId)),
    ])

    const user = userData[0]
    const userEmail = user?.email

    let invitationData: Record<string, unknown>[] = []
    if (userEmail) {
      const [sentInvitations, receivedInvitations] = await Promise.all([
        this.db
          .select({
            email: invitations.email,
            organizationName: organizations.name,
            role: invitations.role,
            status: invitations.status,
          })
          .from(invitations)
          .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
          .where(eq(invitations.inviterId, userId)),

        this.db
          .select({
            email: invitations.email,
            organizationName: organizations.name,
            role: invitations.role,
            status: invitations.status,
          })
          .from(invitations)
          .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
          .where(eq(invitations.email, userEmail)),
      ])

      const sentKeys = new Set(sentInvitations.map((i) => `${i.organizationName}-${i.email}`))

      invitationData = [
        ...sentInvitations.map((i) => ({ ...i, direction: 'sent' as const })),
        ...receivedInvitations
          .filter((i) => !sentKeys.has(`${i.organizationName}-${i.email}`))
          .map((i) => ({ ...i, direction: 'received' as const })),
      ]
    }

    return {
      exportedAt: new Date().toISOString(),
      user: user ?? {},
      sessions: sessionData,
      accounts: accountData,
      organizations: orgData,
      invitations: invitationData,
      consent: consentData,
    }
  }
}
