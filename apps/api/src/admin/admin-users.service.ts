import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, desc, eq, exists, ilike, inArray, isNotNull, isNull, or, type SQL } from 'drizzle-orm'
import { ClsService } from 'nestjs-cls'
import { AuditService } from '../audit/audit.service.js'
import {
  buildCursorCondition,
  buildCursorResponse,
} from '../common/utils/cursor-pagination.util.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { auditLogs } from '../database/schema/audit.schema.js'
import { members, organizations, users } from '../database/schema/auth.schema.js'
import { EmailConflictException } from './exceptions/email-conflict.exception.js'
import { NotDeletedException } from './exceptions/not-deleted.exception.js'
import { SelfActionException } from './exceptions/self-action.exception.js'
import { SuperadminProtectionException } from './exceptions/superadmin-protection.exception.js'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception.js'
import { AdminUserNotFoundException } from './exceptions/user-not-found.exception.js'
import { redactSensitiveFields } from './utils/redact-sensitive-fields.js'

/**
 * AdminUsersService — cross-tenant user management for super admins.
 *
 * Uses raw DRIZZLE connection (not TenantService) because admin operations
 * require cross-tenant access. No organizationId scoping on user queries.
 *
 * WARNING: The raw DRIZZLE connection bypasses all RLS policies.
 */
@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService,
    private readonly cls: ClsService
  ) {}

  /**
   * List users with cursor-based pagination and optional filters.
   *
   * Uses a two-query approach to avoid duplicate rows from LEFT JOIN:
   * 1. Query users table only (with filters, cursor, limit).
   * 2. Batch-fetch memberships for the returned user IDs.
   */
  async listUsers(
    filters: { role?: string; status?: string; organizationId?: string; search?: string },
    cursor?: string,
    limit = 20
  ) {
    const conditions: SQL[] = []

    // Role filter
    if (filters.role) {
      conditions.push(eq(users.role, filters.role))
    }

    // Status filter
    if (filters.status === 'active') {
      conditions.push(eq(users.banned, false))
      conditions.push(isNull(users.deletedAt))
    } else if (filters.status === 'banned') {
      conditions.push(eq(users.banned, true))
    } else if (filters.status === 'archived') {
      conditions.push(isNotNull(users.deletedAt))
    }

    // Organization filter — EXISTS subquery on members table
    if (filters.organizationId) {
      conditions.push(
        exists(
          this.db
            .select({ one: members.id })
            .from(members)
            .where(
              and(eq(members.userId, users.id), eq(members.organizationId, filters.organizationId))
            )
        )
      )
    }

    // Search filter — ILIKE on name and email with escaping
    if (filters.search) {
      const escaped = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      const pattern = `%${escaped}%`
      conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!)
    }

    // Cursor condition
    if (cursor) {
      conditions.push(buildCursorCondition(cursor, users.createdAt, users.id))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Query 1: Users only (no joins) — correct pagination without duplicates
    const userRows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(limit + 1)

    // Build cursor response before fetching memberships (uses limit+1 logic)
    const paginatedResult = buildCursorResponse(
      userRows,
      limit,
      (row) => row.createdAt,
      (row) => row.id
    )

    // Query 2: Batch-fetch memberships for the page of users
    const userIds = paginatedResult.data.map((u) => u.id)
    let membershipsByUserId: Map<
      string,
      { id: string; name: string; slug: string | null; role: string }[]
    > = new Map()

    if (userIds.length > 0) {
      const membershipRows = await this.db
        .select({
          userId: members.userId,
          orgId: organizations.id,
          orgName: organizations.name,
          orgSlug: organizations.slug,
          role: members.role,
        })
        .from(members)
        .innerJoin(organizations, eq(members.organizationId, organizations.id))
        .where(inArray(members.userId, userIds))

      membershipsByUserId = new Map()
      for (const row of membershipRows) {
        const list = membershipsByUserId.get(row.userId) ?? []
        list.push({ id: row.orgId, name: row.orgName, slug: row.orgSlug, role: row.role })
        membershipsByUserId.set(row.userId, list)
      }
    }

    // Merge organizations onto each user
    const data = paginatedResult.data.map((user) => ({
      ...user,
      organizations: membershipsByUserId.get(user.id) ?? [],
    }))

    return { data, cursor: paginatedResult.cursor }
  }

  /**
   * Get detailed user info with org memberships and recent audit entries.
   */
  async getUserDetail(userId: string) {
    // 1. User lookup
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new AdminUserNotFoundException(userId)
    }

    // 2. Memberships (join members + organizations)
    const memberships = await this.db
      .select({
        memberId: members.id,
        orgId: organizations.id,
        orgName: organizations.name,
        orgSlug: organizations.slug,
        role: members.role,
        joinedAt: members.createdAt,
      })
      .from(members)
      .innerJoin(organizations, eq(members.organizationId, organizations.id))
      .where(eq(members.userId, userId))

    // 3. Audit entries (last 10 where resourceId=userId AND resource='user' OR actorId=userId)
    const auditEntries = await this.db
      .select({
        id: auditLogs.id,
        timestamp: auditLogs.timestamp,
        actorId: auditLogs.actorId,
        actorType: auditLogs.actorType,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        before: auditLogs.before,
        after: auditLogs.after,
        metadata: auditLogs.metadata,
      })
      .from(auditLogs)
      .where(
        or(
          and(eq(auditLogs.resourceId, userId), eq(auditLogs.resource, 'user')),
          eq(auditLogs.actorId, userId)
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(10)

    // Redact sensitive fields from audit log before/after data
    const redactedEntries = auditEntries.map((entry) => ({
      ...entry,
      before: redactSensitiveFields(entry.before),
      after: redactSensitiveFields(entry.after),
    }))

    return {
      ...user,
      organizations: memberships.map((m) => ({
        id: m.orgId,
        name: m.orgName,
        slug: m.orgSlug,
        role: m.role,
      })),
      activitySummary: redactedEntries,
    }
  }

  /**
   * Update user profile fields (name, email, role).
   * Records before/after audit snapshots.
   */
  async updateUser(
    userId: string,
    data: { name?: string; email?: string; role?: string },
    actorId: string
  ) {
    // Read before-state
    const [beforeUser] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!beforeUser) {
      throw new AdminUserNotFoundException(userId)
    }

    // Prevent self role change
    if (data.role && actorId === userId) {
      throw new SelfActionException()
    }

    // Prevent demotion of other superadmins
    if (data.role && data.role !== 'superadmin' && beforeUser.role === 'superadmin') {
      throw new SuperadminProtectionException()
    }

    // Perform the update
    let updatedUser: typeof users.$inferSelect
    try {
      const [result] = await this.db.update(users).set(data).where(eq(users.id, userId)).returning()
      updatedUser = result!
    } catch (err) {
      const pgErr = err as { code?: string }
      if (pgErr.code === '23505') {
        throw new EmailConflictException()
      }
      throw err
    }

    // Determine audit action: use 'user.role_changed' for role changes
    const auditAction =
      data.role && data.role !== beforeUser.role ? 'user.role_changed' : 'user.updated'

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: auditAction,
        resource: 'user',
        resourceId: userId,
        before: { ...beforeUser },
        after: { ...updatedUser },
      })
      .catch((err) => {
        this.logger.error(
          { correlationId: this.cls.getId(), action: auditAction, error: err.message },
          'Audit log write failed'
        )
        // TODO: Add metrics counter for audit failures (Phase 3)
      })

    return updatedUser
  }

  /**
   * Ban a user.
   */
  async banUser(userId: string, reason: string, expires: Date | null, actorId: string) {
    if (actorId === userId) {
      throw new SelfActionException()
    }

    // Read current user
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new AdminUserNotFoundException(userId)
    }

    if (user.role === 'superadmin') {
      throw new SuperadminProtectionException()
    }

    if (user.banned) {
      throw new UserAlreadyBannedException(userId)
    }

    // Update ban fields
    const [updatedUser] = await this.db
      .update(users)
      .set({
        banned: true,
        banReason: reason,
        banExpires: expires,
      })
      .where(eq(users.id, userId))
      .returning()

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'user.banned',
        resource: 'user',
        resourceId: userId,
        before: { ...user },
        after: { ...updatedUser },
      })
      .catch((err) => {
        this.logger.error(
          { correlationId: this.cls.getId(), action: 'user.banned', error: err.message },
          'Audit log write failed'
        )
        // TODO: Add metrics counter for audit failures (Phase 3)
      })

    return updatedUser
  }

  /**
   * Unban a user — set banned=false, clear banReason and banExpires.
   */
  async unbanUser(userId: string, actorId: string) {
    // Read current user
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new AdminUserNotFoundException(userId)
    }

    // Update ban fields
    const [updatedUser] = await this.db
      .update(users)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
      })
      .where(eq(users.id, userId))
      .returning()

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'user.unbanned',
        resource: 'user',
        resourceId: userId,
        before: { ...user },
        after: { ...updatedUser },
      })
      .catch((err) => {
        this.logger.error(
          { correlationId: this.cls.getId(), action: 'user.unbanned', error: err.message },
          'Audit log write failed'
        )
        // TODO: Add metrics counter for audit failures (Phase 3)
      })

    return updatedUser
  }

  /**
   * Soft-delete a user — set deletedAt and deleteScheduledFor (now + 30 days).
   */
  async deleteUser(userId: string, actorId: string) {
    if (actorId === userId) {
      throw new SelfActionException()
    }

    // Read current user
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new AdminUserNotFoundException(userId)
    }

    if (user.role === 'superadmin') {
      throw new SuperadminProtectionException()
    }

    if (user.deletedAt) {
      throw new NotDeletedException('User', userId)
    }

    const now = new Date()
    const scheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Update deletion fields
    const [updatedUser] = await this.db
      .update(users)
      .set({
        deletedAt: now,
        deleteScheduledFor: scheduledFor,
      })
      .where(eq(users.id, userId))
      .returning()

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'user.deleted',
        resource: 'user',
        resourceId: userId,
        before: { ...user },
        after: { ...updatedUser },
      })
      .catch((err) => {
        this.logger.error(
          { correlationId: this.cls.getId(), action: 'user.deleted', error: err.message },
          'Audit log write failed'
        )
        // TODO: Add metrics counter for audit failures (Phase 3)
      })

    return updatedUser
  }

  /**
   * Restore a soft-deleted user — clear deletedAt and deleteScheduledFor.
   */
  async restoreUser(userId: string, actorId: string) {
    // Read current user
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new AdminUserNotFoundException(userId)
    }

    // Verify user is actually deleted
    if (!user.deletedAt) {
      throw new NotDeletedException('User', userId)
    }

    // Clear deletion fields
    const [updatedUser] = await this.db
      .update(users)
      .set({
        deletedAt: null,
        deleteScheduledFor: null,
      })
      .where(eq(users.id, userId))
      .returning()

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'user.restored',
        resource: 'user',
        resourceId: userId,
        before: { ...user },
        after: { ...updatedUser },
      })
      .catch((err) => {
        this.logger.error(
          { correlationId: this.cls.getId(), action: 'user.restored', error: err.message },
          'Audit log write failed'
        )
        // TODO: Add metrics counter for audit failures (Phase 3)
      })

    return updatedUser
  }
}
