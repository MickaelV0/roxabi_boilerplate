import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, count, eq, ilike, or } from 'drizzle-orm'
import { ClsService } from 'nestjs-cls'
import { AuditService } from '../audit/audit.service.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { invitations, members, users } from '../database/schema/auth.schema.js'
import { roles } from '../database/schema/rbac.schema.js'
import { InvitationAlreadyPendingException } from './exceptions/invitation-already-pending.exception.js'
import { InvitationNotFoundException } from './exceptions/invitation-not-found.exception.js'
import { LastOwnerConstraintException } from './exceptions/last-owner-constraint.exception.js'
import { MemberAlreadyExistsException } from './exceptions/member-already-exists.exception.js'
import { AdminMemberNotFoundException } from './exceptions/member-not-found.exception.js'
import { AdminRoleNotFoundException } from './exceptions/role-not-found.exception.js'
import { SelfRemovalException } from './exceptions/self-removal.exception.js'
import { SelfRoleChangeException } from './exceptions/self-role-change.exception.js'

/**
 * AdminMembersService intentionally uses the raw DRIZZLE connection (not TenantService)
 * because admin operations require organization-scoped access that is explicitly filtered
 * by organizationId in every query. The active organization is derived from the user's
 * session (session.activeOrganizationId), not from RLS policies.
 *
 * WARNING: The raw DRIZZLE connection bypasses all RLS policies. Any new queries added
 * to this service MUST include explicit WHERE clauses filtering by organizationId.
 * Changes to this file should be flagged in code review.
 */
@Injectable()
export class AdminMembersService {
  private readonly logger = new Logger(AdminMembersService.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService,
    private readonly cls: ClsService
  ) {}

  /**
   * List members for an organization with offset-based pagination.
   * Joins members -> users -> roles to return full details.
   * Supports optional server-side search by user name or email (ILIKE).
   */
  async listMembers(orgId: string, options: { page: number; limit: number; search?: string }) {
    const offset = (options.page - 1) * options.limit

    const conditions = [eq(members.organizationId, orgId)]
    if (options.search) {
      const pattern = `%${options.search}%`
      conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!)
    }
    const whereClause = and(...conditions)

    const [memberRows, totalResult] = await Promise.all([
      this.db
        .select({
          id: members.id,
          userId: members.userId,
          role: members.role,
          roleId: members.roleId,
          createdAt: members.createdAt,
          userName: users.name,
          userEmail: users.email,
          userImage: users.image,
          roleName: roles.name,
          roleSlug: roles.slug,
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .leftJoin(roles, eq(members.roleId, roles.id))
        .where(whereClause)
        .orderBy(users.name)
        .limit(options.limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(whereClause),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: memberRows.map((row) => ({
        id: row.id,
        userId: row.userId,
        role: row.role,
        roleId: row.roleId,
        createdAt: row.createdAt,
        user: {
          name: row.userName,
          email: row.userEmail,
          image: row.userImage,
        },
        roleDetails: row.roleName
          ? {
              name: row.roleName,
              slug: row.roleSlug,
            }
          : null,
      })),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    }
  }

  /**
   * Invite a new member to the organization.
   * Checks for existing membership and pending invitations.
   */
  async inviteMember(orgId: string, data: { email: string; roleId: string }, actorId: string) {
    // Look up the role to get its slug for the legacy `role` field
    const [role] = await this.db
      .select({ id: roles.id, slug: roles.slug })
      .from(roles)
      .where(and(eq(roles.id, data.roleId), eq(roles.tenantId, orgId)))
      .limit(1)

    if (!role) {
      throw new AdminRoleNotFoundException(data.roleId)
    }

    // Check if a user with this email is already a member
    // NOTE (TOCTOU): The sequential SELECT + INSERT is not atomic. A member could be added
    // between the check and the insert. The unique constraint catch block below handles the
    // invitation race. The member-exists check is a best-effort guard; a concurrent membership
    // addition is an acceptable edge case for Phase 1.
    const [existingMember] = await this.db
      .select({ id: members.id })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(eq(members.organizationId, orgId), eq(users.email, data.email)))
      .limit(1)

    if (existingMember) {
      throw new MemberAlreadyExistsException()
    }

    // Check for existing pending invitation
    const [existingInvitation] = await this.db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, orgId),
          eq(invitations.email, data.email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1)

    if (existingInvitation) {
      throw new InvitationAlreadyPendingException()
    }

    // Create the invitation with both roleId-derived slug and legacy role field
    // TODO: Add roleId column to invitations schema and store data.roleId here
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    let invitation: typeof invitations.$inferSelect | undefined
    try {
      ;[invitation] = await this.db
        .insert(invitations)
        .values({
          organizationId: orgId,
          email: data.email,
          role: role.slug,
          status: 'pending',
          inviterId: actorId,
          expiresAt,
        })
        .returning()
    } catch (err) {
      invitation = await this.handleInviteConstraintViolation(
        err,
        orgId,
        data.email,
        role.slug,
        actorId,
        expiresAt
      )
    }

    // Audit log (fire-and-forget)
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        organizationId: orgId,
        action: 'member.invited',
        resource: 'invitation',
        resourceId: invitation?.id ?? '',
        after: {
          email: data.email,
          roleId: data.roleId,
          roleSlug: role.slug,
        },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log member.invited`, err)
      })

    return invitation
  }

  /**
   * Change a member's role within the organization.
   * Updates both the roleId FK and the legacy `role` text field.
   */
  async changeMemberRole(
    memberId: string,
    orgId: string,
    data: { roleId: string },
    actorId: string
  ) {
    // Verify the target role exists in this org
    const [newRole] = await this.db
      .select({ id: roles.id, slug: roles.slug, name: roles.name })
      .from(roles)
      .where(and(eq(roles.id, data.roleId), eq(roles.tenantId, orgId)))
      .limit(1)

    if (!newRole) {
      throw new AdminRoleNotFoundException(data.roleId)
    }

    // Get the member with their current role info in a single joined query
    const [memberWithRole] = await this.db
      .select({
        id: members.id,
        userId: members.userId,
        role: members.role,
        roleId: members.roleId,
        currentRoleSlug: roles.slug,
        currentRoleName: roles.name,
      })
      .from(members)
      .leftJoin(roles, eq(members.roleId, roles.id))
      .where(and(eq(members.id, memberId), eq(members.organizationId, orgId)))
      .limit(1)

    if (!memberWithRole) {
      throw new AdminMemberNotFoundException(memberId)
    }

    // Prevent self-role-change (no self-escalation)
    if (memberWithRole.userId === actorId) {
      throw new SelfRoleChangeException()
    }

    // Short-circuit if the role is already the same (S9)
    if (memberWithRole.roleId === data.roleId) {
      return { updated: true }
    }

    const beforeRoleSlug = memberWithRole.currentRoleSlug ?? null
    const beforeRoleName = memberWithRole.currentRoleName ?? null

    // Update both roleId and legacy role field
    await this.db
      .update(members)
      .set({ roleId: data.roleId, role: newRole.slug })
      .where(eq(members.id, memberId))

    // Audit log with before/after snapshots (fire-and-forget)
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        organizationId: orgId,
        action: 'member.role_changed',
        resource: 'member',
        resourceId: memberId,
        before: {
          roleId: memberWithRole.roleId,
          roleSlug: beforeRoleSlug,
          roleName: beforeRoleName,
        },
        after: {
          roleId: newRole.id,
          roleSlug: newRole.slug,
          roleName: newRole.name,
        },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log member.role_changed`, err)
      })

    return { updated: true }
  }

  /**
   * Remove a member from the organization.
   * Prevents removing the last owner.
   */
  async removeMember(memberId: string, orgId: string, actorId: string) {
    // Get the member with role info in a single joined query
    const [member] = await this.db
      .select({
        id: members.id,
        userId: members.userId,
        role: members.role,
        roleId: members.roleId,
        roleSlug: roles.slug,
      })
      .from(members)
      .leftJoin(roles, eq(members.roleId, roles.id))
      .where(and(eq(members.id, memberId), eq(members.organizationId, orgId)))
      .limit(1)

    if (!member) {
      throw new AdminMemberNotFoundException(memberId)
    }

    // Prevent self-removal
    if (member.userId === actorId) {
      throw new SelfRemovalException()
    }

    // Check if this is the last owner (check both roleSlug and legacy role field for safety)
    if (member.roleSlug === 'owner' || member.role === 'owner') {
      const [ownerCount] = await this.db
        .select({ count: count() })
        .from(members)
        // biome-ignore lint/style/noNonNullAssertion: roleId is guaranteed by the owner role check above
        .where(and(eq(members.organizationId, orgId), eq(members.roleId, member.roleId!)))

      if ((ownerCount?.count ?? 0) <= 1) {
        throw new LastOwnerConstraintException()
      }
    }

    // Delete the member
    await this.db.delete(members).where(eq(members.id, memberId))

    // Audit log (fire-and-forget)
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        organizationId: orgId,
        action: 'member.removed',
        resource: 'member',
        resourceId: memberId,
        before: {
          userId: member.userId,
          role: member.role,
          roleId: member.roleId,
        },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log member.removed`, err)
      })

    return { removed: true }
  }

  /**
   * Handle unique constraint violation during invitation insert.
   * Uses postgres error code 23505 (unique_violation) instead of fragile string matching.
   *
   * NOTE (W7): The unique constraint is on (org, email) regardless of status.
   * If a non-pending invitation (accepted/rejected/expired) exists, update it
   * to pending instead of throwing.
   */
  private async handleInviteConstraintViolation(
    err: unknown,
    orgId: string,
    email: string,
    roleSlug: string,
    actorId: string,
    expiresAt: Date
  ): Promise<typeof invitations.$inferSelect | undefined> {
    const pgErr = err as { code?: string; constraint_name?: string }
    if (pgErr.code !== '23505' || pgErr.constraint_name !== 'invitations_org_email_unique') {
      throw err
    }

    const [existing] = await this.db
      .select({ id: invitations.id, status: invitations.status })
      .from(invitations)
      .where(and(eq(invitations.organizationId, orgId), eq(invitations.email, email)))
      .limit(1)

    if (existing && existing.status === 'pending') {
      throw new InvitationAlreadyPendingException()
    }

    // Re-invite: update existing non-pending invitation back to pending
    if (existing) {
      const [updated] = await this.db
        .update(invitations)
        .set({
          role: roleSlug,
          status: 'pending',
          inviterId: actorId,
          expiresAt,
        })
        .where(eq(invitations.id, existing.id))
        .returning()
      return updated
    }

    // Fallback: constraint violation but no matching row found — re-throw
    throw err
  }

  /**
   * List pending invitations for an organization.
   */
  async listPendingInvitations(orgId: string) {
    const rows = await this.db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
      })
      .from(invitations)
      .where(and(eq(invitations.organizationId, orgId), eq(invitations.status, 'pending')))
      .orderBy(invitations.expiresAt)

    return { data: rows }
  }

  /**
   * Revoke (delete) a pending invitation.
   * Verifies the invitation belongs to the given organization before deleting.
   */
  async revokeInvitation(invitationId: string, orgId: string, actorId: string) {
    const [invitation] = await this.db
      .select({
        id: invitations.id,
        email: invitations.email,
        organizationId: invitations.organizationId,
      })
      .from(invitations)
      .where(and(eq(invitations.id, invitationId), eq(invitations.organizationId, orgId)))
      .limit(1)

    if (!invitation) {
      throw new InvitationNotFoundException(invitationId)
    }

    await this.db.delete(invitations).where(eq(invitations.id, invitationId))

    // Audit log (fire-and-forget)
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        organizationId: orgId,
        action: 'invitation.revoked',
        resource: 'invitation',
        resourceId: invitationId,
        before: { email: invitation.email },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log invitation.revoked`, err)
      })

    return { revoked: true }
  }
}
