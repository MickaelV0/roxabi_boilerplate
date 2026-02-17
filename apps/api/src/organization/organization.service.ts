import { Inject, Injectable } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'

@Injectable()
export class OrganizationService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async softDelete(_orgId: string, _userId: string) {
    // TODO: implement — set deletedAt + deleteScheduledFor (now + 30 days) on the organization
    // TODO: implement — clear activeOrganizationId on all sessions referencing this org
    // TODO: implement — invalidate pending invitations (set status = 'expired')
    // TODO: implement — return updated org with deletion schedule
    throw new Error('Not implemented')
  }

  async reactivate(_orgId: string, _userId: string) {
    // TODO: implement — verify user is owner (query members table)
    // TODO: implement — clear deletedAt and deleteScheduledFor
    // TODO: implement — return reactivated org
    throw new Error('Not implemented')
  }

  async getDeletionImpact(_orgId: string) {
    // TODO: implement — count members, pending invitations, custom roles
    // TODO: implement — return { memberCount, invitationCount, customRoleCount }
    throw new Error('Not implemented')
  }
}
