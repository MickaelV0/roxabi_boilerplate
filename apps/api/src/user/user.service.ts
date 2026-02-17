import { Inject, Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import {
  invitations,
  members,
  organizations,
  sessions,
  users,
} from '../database/schema/auth.schema.js'
import { EmailConfirmationMismatchException } from './exceptions/email-confirmation-mismatch.exception.js'
import { UserNotFoundException } from './exceptions/user-not-found.exception.js'

const profileColumns = {
  id: users.id,
  name: users.name,
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

type OrgResolution =
  | { orgId: string; action: 'transfer'; newOwnerId: string }
  | { orgId: string; action: 'delete' }

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getProfile(userId: string) {
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
      name?: string
      avatarSeed?: string | null
      avatarStyle?: string | null
    }
  ) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    if (data.avatarSeed !== undefined) updateData.avatarSeed = data.avatarSeed
    if (data.avatarStyle !== undefined) updateData.avatarStyle = data.avatarStyle

    // If fullName (name) is directly edited, set fullNameCustomized = true
    if (data.name !== undefined) {
      updateData.name = data.name
      updateData.fullNameCustomized = true
    }

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName

    // If firstName or lastName changed and fullName was NOT directly edited,
    // auto-update name from first + last (only if fullNameCustomized is false)
    if ((data.firstName !== undefined || data.lastName !== undefined) && data.name === undefined) {
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
      .where(eq(users.id, userId))
      .returning(profileColumns)
    if (!updated) throw new UserNotFoundException(userId)
    return updated
  }

  async softDelete(userId: string, confirmEmail: string, orgResolutions: OrgResolution[]) {
    // Fetch the user to validate email
    const [user] = await this.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) throw new UserNotFoundException(userId)

    if (user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
      throw new EmailConfirmationMismatchException()
    }

    const now = new Date()
    const deleteScheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return await this.db.transaction(async (tx) => {
      // Process org resolutions
      for (const resolution of orgResolutions) {
        if (resolution.action === 'transfer') {
          // Transfer ownership: update role on target member
          await tx
            .update(members)
            .set({ role: 'owner', updatedAt: now })
            .where(
              and(
                eq(members.organizationId, resolution.orgId),
                eq(members.userId, resolution.newOwnerId)
              )
            )
        } else if (resolution.action === 'delete') {
          // Soft-delete the organization
          await tx
            .update(organizations)
            .set({ deletedAt: now, deleteScheduledFor, updatedAt: now })
            .where(eq(organizations.id, resolution.orgId))

          // Clear activeOrganizationId on sessions referencing this org
          await tx
            .update(sessions)
            .set({ activeOrganizationId: null })
            .where(eq(sessions.activeOrganizationId, resolution.orgId))

          // Invalidate pending invitations for this org
          await tx
            .update(invitations)
            .set({ status: 'expired' })
            .where(
              and(
                eq(invitations.organizationId, resolution.orgId),
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
      .where(and(eq(members.userId, userId), eq(members.role, 'owner')))

    return ownedOrgs
  }
}
