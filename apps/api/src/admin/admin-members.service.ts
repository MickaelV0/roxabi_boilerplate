import { Inject, Injectable } from '@nestjs/common'
import { and, count, eq } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { invitations, members, users } from '../database/schema/auth.schema.js'
import { roles } from '../database/schema/rbac.schema.js'
import { MemberNotFoundException } from '../rbac/exceptions/member-not-found.exception.js'
import { RoleNotFoundException } from '../rbac/exceptions/role-not-found.exception.js'
import { InvitationAlreadyPendingException } from './exceptions/invitation-already-pending.exception.js'
import { LastOwnerConstraintException } from './exceptions/last-owner-constraint.exception.js'
import { MemberAlreadyExistsException } from './exceptions/member-already-exists.exception.js'

@Injectable()
export class AdminMembersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService
  ) {}

  /**
   * List members for an organization with offset-based pagination.
   * Joins members -> users -> roles to return full details.
   */
  async listMembers(orgId: string, options: { page: number; limit: number }) {
    const offset = (options.page - 1) * options.limit

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
        .where(eq(members.organizationId, orgId))
        .orderBy(users.name)
        .limit(options.limit)
        .offset(offset),
      this.db.select({ count: count() }).from(members).where(eq(members.organizationId, orgId)),
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
      throw new RoleNotFoundException(data.roleId)
    }

    // Check if a user with this email is already a member
    const [existingMember] = await this.db
      .select({ id: members.id })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(eq(members.organizationId, orgId), eq(users.email, data.email)))
      .limit(1)

    if (existingMember) {
      throw new MemberAlreadyExistsException(data.email)
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
      throw new InvitationAlreadyPendingException(data.email)
    }

    // Create the invitation with both roleId-derived slug and legacy role field
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const [invitation] = await this.db
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

    // Audit log
    await this.auditService.log({
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
      throw new RoleNotFoundException(data.roleId)
    }

    // Get the member with their current role info (before snapshot)
    const [member] = await this.db
      .select({
        id: members.id,
        userId: members.userId,
        role: members.role,
        roleId: members.roleId,
      })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.organizationId, orgId)))
      .limit(1)

    if (!member) {
      throw new MemberNotFoundException(memberId)
    }

    // Capture before state for audit
    let beforeRoleSlug: string | null = null
    let beforeRoleName: string | null = null
    if (member.roleId) {
      const [currentRole] = await this.db
        .select({ slug: roles.slug, name: roles.name })
        .from(roles)
        .where(eq(roles.id, member.roleId))
        .limit(1)
      beforeRoleSlug = currentRole?.slug ?? null
      beforeRoleName = currentRole?.name ?? null
    }

    // Update both roleId and legacy role field
    await this.db
      .update(members)
      .set({ roleId: data.roleId, role: newRole.slug })
      .where(eq(members.id, memberId))

    // Audit log with before/after snapshots
    await this.auditService.log({
      actorId,
      actorType: 'user',
      organizationId: orgId,
      action: 'member.role_changed',
      resource: 'member',
      resourceId: memberId,
      before: {
        roleId: member.roleId,
        roleSlug: beforeRoleSlug,
        roleName: beforeRoleName,
      },
      after: {
        roleId: newRole.id,
        roleSlug: newRole.slug,
        roleName: newRole.name,
      },
    })

    return { updated: true }
  }

  /**
   * Remove a member from the organization.
   * Prevents removing the last owner.
   */
  async removeMember(memberId: string, orgId: string, actorId: string) {
    // Get the member
    const [member] = await this.db
      .select({
        id: members.id,
        userId: members.userId,
        role: members.role,
        roleId: members.roleId,
      })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.organizationId, orgId)))
      .limit(1)

    if (!member) {
      throw new MemberNotFoundException(memberId)
    }

    // Check if this is the last owner
    if (member.roleId) {
      const [currentRole] = await this.db
        .select({ slug: roles.slug })
        .from(roles)
        .where(eq(roles.id, member.roleId))
        .limit(1)

      if (currentRole?.slug === 'owner') {
        // Count members with owner role in this org
        const [ownerCount] = await this.db
          .select({ count: count() })
          .from(members)
          .where(and(eq(members.organizationId, orgId), eq(members.roleId, member.roleId)))

        if ((ownerCount?.count ?? 0) <= 1) {
          throw new LastOwnerConstraintException()
        }
      }
    }

    // Delete the member
    await this.db.delete(members).where(eq(members.id, memberId))

    // Audit log
    await this.auditService.log({
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

    return { removed: true }
  }
}
