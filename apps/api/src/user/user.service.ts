import { Inject, Injectable } from '@nestjs/common'
import type { OrgOwnershipResolution } from '@repo/types'
import { and, eq, isNotNull } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { whereActive } from '../database/helpers/where-active.js'
import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
} from '../database/schema/auth.schema.js'
import { roles } from '../database/schema/rbac.schema.js'
import { OrgNotOwnerException } from '../organization/exceptions/org-not-owner.exception.js'
import { AccountAlreadyDeletedException } from './exceptions/account-already-deleted.exception.js'
import { AccountNotDeletedException } from './exceptions/account-not-deleted.exception.js'
import { EmailConfirmationMismatchException } from './exceptions/email-confirmation-mismatch.exception.js'
import { TransferTargetNotMemberException } from './exceptions/transfer-target-not-member.exception.js'
import { UserNotFoundException } from './exceptions/user-not-found.exception.js'

const profileColumns = {
  id: users.id,
  fullName: users.name,
  firstName: users.firstName,
  lastName: users.lastName,
  fullNameCustomized: users.fullNameCustomized,
  email: users.email,
  emailVerified: users.emailVerified,
  image: users.image,
  avatarSeed: users.avatarSeed,
  avatarStyle: users.avatarStyle,
  role: users.role,
  deletedAt: users.deletedAt,
  deleteScheduledFor: users.deleteScheduledFor,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

/** Simple in-memory TTL cache for soft-delete status lookups */
const SOFT_DELETE_CACHE_TTL_MS = 60_000
const softDeleteCache = new Map<
  string,
  { value: { deletedAt: Date | null; deleteScheduledFor: Date | null } | null; expiresAt: number }
>()

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getSoftDeleteStatus(userId: string) {
    const cached = softDeleteCache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value
    }

    const [user] = await this.db
      .select({ deletedAt: users.deletedAt, deleteScheduledFor: users.deleteScheduledFor })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const result = user ?? null
    softDeleteCache.set(userId, { value: result, expiresAt: Date.now() + SOFT_DELETE_CACHE_TTL_MS })
    return result
  }

  /** Invalidate the soft-delete status cache for a user */
  private invalidateSoftDeleteCache(userId: string) {
    softDeleteCache.delete(userId)
  }

  async getProfile(userId: string) {
    // whereActive is intentionally omitted: the AuthGuard blocks soft-deleted users
    // from most endpoints, and the profile page needs to display deletion status
    // (deletedAt, deleteScheduledFor) so users can see and reactivate their account.
    const [user] = await this.db
      .select(profileColumns)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) throw new UserNotFoundException(userId)
    return user
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string
      lastName?: string
      fullName?: string
      avatarSeed?: string | null
      avatarStyle?: string | null
    }
  ) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    if (data.avatarSeed !== undefined) updateData.avatarSeed = data.avatarSeed
    if (data.avatarStyle !== undefined) updateData.avatarStyle = data.avatarStyle

    // If fullName is directly edited, set fullNameCustomized = true
    if (data.fullName !== undefined) {
      updateData.name = data.fullName
      updateData.fullNameCustomized = true
    }

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName

    // If firstName or lastName changed and fullName was NOT directly edited,
    // auto-update name from first + last (only if fullNameCustomized is false)
    if (
      (data.firstName !== undefined || data.lastName !== undefined) &&
      data.fullName === undefined
    ) {
      const [current] = await this.db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          fullNameCustomized: users.fullNameCustomized,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      if (!current) throw new UserNotFoundException(userId)

      if (!current.fullNameCustomized) {
        const newFirst = data.firstName ?? current.firstName
        const newLast = data.lastName ?? current.lastName
        updateData.name = `${newFirst} ${newLast}`.trim()
      }
    }

    const [updated] = await this.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, userId), whereActive(users)))
      .returning(profileColumns)
    if (!updated) throw new UserNotFoundException(userId)
    return updated
  }

  async softDelete(userId: string, confirmEmail: string, orgResolutions: OrgOwnershipResolution[]) {
    // Fetch the user to validate email and check deletion status
    const [user] = await this.db
      .select({ id: users.id, email: users.email, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) throw new UserNotFoundException(userId)

    // Block re-deletion: prevent scheduling deletion on an already-deleted account
    if (user.deletedAt) {
      throw new AccountAlreadyDeletedException()
    }

    if (user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
      throw new EmailConfirmationMismatchException()
    }

    const now = new Date()
    const deleteScheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: inherent to multi-resolution transaction logic
    return await this.db.transaction(async (tx) => {
      // Process org resolutions
      for (const resolution of orgResolutions) {
        // B1: Verify the deleting user is an owner of this organization
        const [membership] = await tx
          .select({ role: members.role })
          .from(members)
          .where(
            and(eq(members.organizationId, resolution.organizationId), eq(members.userId, userId))
          )
          .limit(1)
        if (!membership || membership.role !== 'owner') {
          throw new OrgNotOwnerException(resolution.organizationId)
        }

        if (resolution.action === 'transfer') {
          // B1: Verify transferToUserId is an existing member of the org
          const [targetMember] = await tx
            .select({ id: members.id })
            .from(members)
            .where(
              and(
                eq(members.organizationId, resolution.organizationId),
                eq(members.userId, resolution.transferToUserId)
              )
            )
            .limit(1)
          if (!targetMember) {
            throw new TransferTargetNotMemberException(
              resolution.transferToUserId,
              resolution.organizationId
            )
          }

          // Transfer ownership: update role on target member
          await tx
            .update(members)
            .set({ role: 'owner', updatedAt: now })
            .where(
              and(
                eq(members.organizationId, resolution.organizationId),
                eq(members.userId, resolution.transferToUserId)
              )
            )
        } else if (resolution.action === 'delete') {
          // Soft-delete the organization
          await tx
            .update(organizations)
            .set({ deletedAt: now, deleteScheduledFor, updatedAt: now })
            .where(eq(organizations.id, resolution.organizationId))

          // Clear activeOrganizationId on sessions referencing this org
          await tx
            .update(sessions)
            .set({ activeOrganizationId: null })
            .where(eq(sessions.activeOrganizationId, resolution.organizationId))

          // Invalidate pending invitations for this org
          await tx
            .update(invitations)
            .set({ status: 'expired' })
            .where(
              and(
                eq(invitations.organizationId, resolution.organizationId),
                eq(invitations.status, 'pending')
              )
            )
        }
      }

      // Soft-delete the user
      const [updated] = await tx
        .update(users)
        .set({ deletedAt: now, deleteScheduledFor, updatedAt: now })
        .where(eq(users.id, userId))
        .returning(profileColumns)

      // Delete all sessions for this user (force logout)
      await tx.delete(sessions).where(eq(sessions.userId, userId))

      // Invalidate cached soft-delete status after successful deletion
      this.invalidateSoftDeleteCache(userId)

      return updated
    })
  }

  async reactivate(userId: string) {
    const [updated] = await this.db
      .update(users)
      .set({ deletedAt: null, deleteScheduledFor: null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning(profileColumns)
    if (!updated) throw new UserNotFoundException(userId)

    // Invalidate cached soft-delete status after reactivation
    this.invalidateSoftDeleteCache(userId)

    return updated
  }

  async getOwnedOrganizations(userId: string) {
    const ownedOrgs = await this.db
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        orgSlug: organizations.slug,
      })
      .from(members)
      .innerJoin(organizations, eq(members.organizationId, organizations.id))
      .where(and(eq(members.userId, userId), eq(members.role, 'owner'), whereActive(organizations)))

    return ownedOrgs
  }

  async purge(userId: string, confirmEmail: string) {
    // Fetch the user to validate soft-delete status and email
    const [user] = await this.db
      .select({ id: users.id, email: users.email, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) throw new UserNotFoundException(userId)

    // Only soft-deleted users can purge
    if (!user.deletedAt) {
      throw new AccountNotDeletedException()
    }

    if (user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
      throw new EmailConfirmationMismatchException()
    }

    const originalEmail = user.email

    await this.db.transaction(async (tx) => {
      const now = new Date()
      const anonymizedEmail = `deleted-${crypto.randomUUID()}@anonymized.local`

      // Anonymize user record
      await tx
        .update(users)
        .set({
          firstName: 'Deleted',
          lastName: 'User',
          name: 'Deleted User',
          email: anonymizedEmail,
          image: null,
          emailVerified: false,
          avatarSeed: null,
          avatarStyle: null,
          updatedAt: now,
        })
        .where(eq(users.id, userId))

      // Delete sessions
      await tx.delete(sessions).where(eq(sessions.userId, userId))

      // Delete accounts
      await tx.delete(accounts).where(eq(accounts.userId, userId))

      // Delete verifications (by user's original email)
      await tx.delete(verifications).where(eq(verifications.identifier, originalEmail))

      // Delete invitations where inviterId = userId
      await tx.delete(invitations).where(eq(invitations.inviterId, userId))

      // Delete invitations where email = user's original email
      await tx.delete(invitations).where(eq(invitations.email, originalEmail))

      // Purge soft-deleted organizations owned by this user
      const ownedDeletedOrgs = await tx
        .select({ orgId: organizations.id })
        .from(members)
        .innerJoin(organizations, eq(members.organizationId, organizations.id))
        .where(
          and(
            eq(members.userId, userId),
            eq(members.role, 'owner'),
            isNotNull(organizations.deletedAt)
          )
        )

      for (const { orgId } of ownedDeletedOrgs) {
        const anonymizedSlug = `deleted-${crypto.randomUUID()}`

        // Anonymize organization record
        await tx
          .update(organizations)
          .set({
            name: 'Deleted Organization',
            slug: anonymizedSlug,
            logo: null,
            metadata: null,
            updatedAt: now,
          })
          .where(eq(organizations.id, orgId))

        // Delete all members for this org
        await tx.delete(members).where(eq(members.organizationId, orgId))

        // Delete all invitations for this org
        await tx.delete(invitations).where(eq(invitations.organizationId, orgId))

        // Delete tenant-scoped roles (cascade handles role_permissions)
        await tx.delete(roles).where(eq(roles.tenantId, orgId))
      }
    })

    // Invalidate soft-delete cache after purge
    this.invalidateSoftDeleteCache(userId)

    return { success: true }
  }
}
