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
    const whereClause = this.buildMemberSearchClause(orgId, options.search)

    const [memberRows, totalResult] = await Promise.all([
      this.queryMemberRows(whereClause, options.limit, offset),
      this.queryMemberCount(whereClause),
    ])

    const total = totalResult[0]?.count ?? 0

    return {
      data: memberRows.map((row) => this.formatMemberRow(row)),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    }
  }

  private buildMemberSearchClause(orgId: string, search?: string) {
    const conditions = [eq(members.organizationId, orgId)]
    if (search) {
      const pattern = `%${search}%`
      const searchCondition = or(ilike(users.name, pattern), ilike(users.email, pattern))
      if (searchCondition) conditions.push(searchCondition)
    }
    return and(...conditions)
  }

  private queryMemberRows(whereClause: ReturnType<typeof and>, limit: number, offset: number) {
    return this.db
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
      .limit(limit)
      .offset(offset)
  }

  private queryMemberCount(whereClause: ReturnType<typeof and>) {
    return this.db
      .select({ count: count() })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(whereClause)
  }

  private formatMemberRow(row: {
    id: string
    userId: string
    role: string
    roleId: string | null
    createdAt: Date
    userName: string | null
    userEmail: string
    userImage: string | null
    roleName: string | null
    roleSlug: string | null
  }) {
    return {
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
      roleDetails: row.roleName ? { name: row.roleName, slug: row.roleSlug } : null,
    }
  }

  /**
   * Invite a new member to the organization.
   * Checks for existing membership and pending invitations.
   */
  async inviteMember(orgId: string, data: { email: string; roleId: string }, actorId: string) {
    const role = await this.findRoleOrThrow(orgId, data.roleId)
    await this.ensureNoExistingMembership(orgId, data.email)
    await this.ensureNoPendingInvitation(orgId, data.email)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const invitation = await this.insertOrReuseInvitation(
      orgId,
      data.email,
      role.slug,
      actorId,
      expiresAt
    )

    this.logMemberAudit('member.invited', 'invitation', orgId, invitation?.id ?? '', actorId, {
      after: {
        email: data.email,
        roleId: data.roleId,
        roleSlug: role.slug,
      },
    })

    return invitation
  }

  private async findRoleOrThrow(orgId: string, roleId: string) {
    const [role] = await this.db
      .select({ id: roles.id, slug: roles.slug })
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.tenantId, orgId)))
      .limit(1)

    if (!role) {
      throw new AdminRoleNotFoundException(roleId)
    }
    return role
  }

  /**
   * Best-effort check for existing membership.
   * NOTE (TOCTOU): Not atomic -- constraint violation handled in insert path.
   */
  private async ensureNoExistingMembership(orgId: string, email: string) {
    const [existingMember] = await this.db
      .select({ id: members.id })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(eq(members.organizationId, orgId), eq(users.email, email)))
      .limit(1)

    if (existingMember) {
      throw new MemberAlreadyExistsException()
    }
  }

  private async ensureNoPendingInvitation(orgId: string, email: string) {
    const [existingInvitation] = await this.db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, orgId),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1)

    if (existingInvitation) {
      throw new InvitationAlreadyPendingException()
    }
  }

  private async insertOrReuseInvitation(
    orgId: string,
    email: string,
    roleSlug: string,
    actorId: string,
    expiresAt: Date
  ) {
    try {
      const [invitation] = await this.db
        .insert(invitations)
        .values({
          organizationId: orgId,
          email,
          role: roleSlug,
          status: 'pending',
          inviterId: actorId,
          expiresAt,
        })
        .returning()
      return invitation
    } catch (err) {
      return this.handleInviteConstraintViolation(err, orgId, email, roleSlug, actorId, expiresAt)
    }
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
    const newRole = await this.findRoleWithNameOrThrow(orgId, data.roleId)
    const memberWithRole = await this.findMemberWithRole(memberId, orgId)

    if (memberWithRole.userId === actorId) {
      throw new SelfRoleChangeException()
    }

    if (memberWithRole.roleId === data.roleId) {
      return { updated: true }
    }

    await this.db
      .update(members)
      .set({ roleId: data.roleId, role: newRole.slug })
      .where(eq(members.id, memberId))

    this.logMemberAudit('member.role_changed', 'member', orgId, memberId, actorId, {
      before: {
        roleId: memberWithRole.roleId,
        roleSlug: memberWithRole.currentRoleSlug ?? null,
        roleName: memberWithRole.currentRoleName ?? null,
      },
      after: {
        roleId: newRole.id,
        roleSlug: newRole.slug,
        roleName: newRole.name,
      },
    })

    return { updated: true }
  }

  private async findRoleWithNameOrThrow(orgId: string, roleId: string) {
    const [role] = await this.db
      .select({ id: roles.id, slug: roles.slug, name: roles.name })
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.tenantId, orgId)))
      .limit(1)

    if (!role) {
      throw new AdminRoleNotFoundException(roleId)
    }
    return role
  }

  private async findMemberWithRole(memberId: string, orgId: string) {
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
    return memberWithRole
  }

  /**
   * Remove a member from the organization.
   * Prevents removing the last owner.
   */
  async removeMember(memberId: string, orgId: string, actorId: string) {
    const member = await this.findMemberForRemoval(memberId, orgId)

    if (member.userId === actorId) {
      throw new SelfRemovalException()
    }

    await this.ensureNotLastOwner(member, orgId)

    await this.db.delete(members).where(eq(members.id, memberId))

    this.logMemberAudit('member.removed', 'member', orgId, memberId, actorId, {
      before: {
        userId: member.userId,
        role: member.role,
        roleId: member.roleId,
      },
    })

    return { removed: true }
  }

  private async findMemberForRemoval(memberId: string, orgId: string) {
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
    return member
  }

  private async ensureNotLastOwner(
    member: { roleSlug: string | null; role: string; roleId: string | null },
    orgId: string
  ) {
    if (member.roleSlug !== 'owner' && member.role !== 'owner') return

    const [ownerCount] = await this.db
      .select({ count: count() })
      .from(members)
      // biome-ignore lint/style/noNonNullAssertion: roleId is guaranteed by the owner role check above
      .where(and(eq(members.organizationId, orgId), eq(members.roleId, member.roleId!)))

    if ((ownerCount?.count ?? 0) <= 1) {
      throw new LastOwnerConstraintException()
    }
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

    this.logMemberAudit('invitation.revoked', 'invitation', orgId, invitationId, actorId, {
      before: { email: invitation.email },
    })

    return { revoked: true }
  }

  private logMemberAudit(
    action: string,
    resource: string,
    orgId: string,
    resourceId: string,
    actorId: string,
    data?: { before?: Record<string, unknown>; after?: Record<string, unknown> }
  ) {
    const payload: Record<string, unknown> = {
      actorId,
      actorType: 'user',
      organizationId: orgId,
      action,
      resource,
      resourceId,
    }
    if (data?.before !== undefined) payload.before = data.before
    if (data?.after !== undefined) payload.after = data.after

    this.auditService.log(payload as Parameters<AuditService['log']>[0]).catch((err) => {
      this.logger.error(`[${this.cls.getId()}][audit] Failed to log ${action}`, err)
    })
  }
}
