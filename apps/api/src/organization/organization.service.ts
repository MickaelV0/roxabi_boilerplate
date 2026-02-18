import { Inject, Injectable } from '@nestjs/common'
import { and, count, eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { whereActive } from '../database/helpers/where-active.js'
import { invitations, members, organizations, sessions } from '../database/schema/auth.schema.js'
import { roles } from '../database/schema/rbac.schema.js'
import { OrgNameConfirmationMismatchException } from './exceptions/org-name-confirmation-mismatch.exception.js'
import { OrgNotDeletedException } from './exceptions/org-not-deleted.exception.js'
import { OrgNotFoundException } from './exceptions/org-not-found.exception.js'
import { OrgNotOwnerException } from './exceptions/org-not-owner.exception.js'

@Injectable()
export class OrganizationService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listForUser(userId: string) {
    return this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        createdAt: organizations.createdAt,
      })
      .from(members)
      .innerJoin(organizations, eq(members.organizationId, organizations.id))
      .where(and(eq(members.userId, userId), whereActive(organizations)))
      .orderBy(organizations.name)
  }

  async softDelete(orgId: string, userId: string, confirmName: string) {
    // Validate org exists and is active
    const [org] = await this.db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(and(eq(organizations.id, orgId), whereActive(organizations)))
      .limit(1)
    if (!org) throw new OrgNotFoundException(orgId)

    // Validate confirmName matches
    if (org.name.toLowerCase() !== confirmName.toLowerCase()) {
      throw new OrgNameConfirmationMismatchException()
    }

    // Validate user is owner
    const [membership] = await this.db
      .select({ role: members.role })
      .from(members)
      .where(and(eq(members.organizationId, orgId), eq(members.userId, userId)))
      .limit(1)
    if (!membership || membership.role !== 'owner') {
      throw new OrgNotOwnerException(orgId)
    }

    const now = new Date()
    const deleteScheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return await this.db.transaction(async (tx) => {
      // Set deletedAt + deleteScheduledFor on the organization
      const [updated] = await tx
        .update(organizations)
        .set({ deletedAt: now, deleteScheduledFor, updatedAt: now })
        .where(eq(organizations.id, orgId))
        .returning({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          deletedAt: organizations.deletedAt,
          deleteScheduledFor: organizations.deleteScheduledFor,
        })

      // Clear activeOrganizationId on all sessions referencing this org
      await tx
        .update(sessions)
        .set({ activeOrganizationId: null })
        .where(eq(sessions.activeOrganizationId, orgId))

      // Invalidate pending invitations (set status = 'expired')
      await tx
        .update(invitations)
        .set({ status: 'expired' })
        .where(and(eq(invitations.organizationId, orgId), eq(invitations.status, 'pending')))

      return updated
    })
  }

  async reactivate(orgId: string, userId: string) {
    // Validate org exists and is actually deleted
    const [org] = await this.db
      .select({
        id: organizations.id,
        deletedAt: organizations.deletedAt,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)
    if (!org) throw new OrgNotFoundException(orgId)
    if (!org.deletedAt) throw new OrgNotDeletedException(orgId)

    // Verify user is owner via members table
    const [membership] = await this.db
      .select({ role: members.role })
      .from(members)
      .where(and(eq(members.organizationId, orgId), eq(members.userId, userId)))
      .limit(1)
    if (!membership || membership.role !== 'owner') {
      throw new OrgNotOwnerException(orgId)
    }

    const [updated] = await this.db
      .update(organizations)
      .set({ deletedAt: null, deleteScheduledFor: null, updatedAt: new Date() })
      .where(eq(organizations.id, orgId))
      .returning({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        deletedAt: organizations.deletedAt,
        deleteScheduledFor: organizations.deleteScheduledFor,
      })

    return updated
  }

  async getDeletionImpact(orgId: string) {
    // Validate org exists and is active
    const [org] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(and(eq(organizations.id, orgId), whereActive(organizations)))
      .limit(1)
    if (!org) throw new OrgNotFoundException(orgId)

    // Count members
    const [memberResult] = await this.db
      .select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, orgId))

    // Count pending invitations
    const [invitationResult] = await this.db
      .select({ count: count() })
      .from(invitations)
      .where(and(eq(invitations.organizationId, orgId), eq(invitations.status, 'pending')))

    // Count custom roles (non-default, tenant-scoped)
    const [roleResult] = await this.db
      .select({ count: count() })
      .from(roles)
      .where(and(eq(roles.tenantId, orgId), eq(roles.isDefault, false)))

    return {
      memberCount: memberResult?.count ?? 0,
      invitationCount: invitationResult?.count ?? 0,
      customRoleCount: roleResult?.count ?? 0,
    }
  }
}
