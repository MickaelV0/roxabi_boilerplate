import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, desc, eq, ilike, isNotNull, isNull, or, type SQL } from 'drizzle-orm'
import { ClsService } from 'nestjs-cls'
import { AuditService } from '../audit/audit.service.js'
import {
  buildCursorCondition,
  buildCursorResponse,
} from '../common/utils/cursor-pagination.util.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { auditLogs } from '../database/schema/audit.schema.js'
import { members, organizations, users } from '../database/schema/auth.schema.js'
import { SENSITIVE_FIELDS } from './admin-audit-logs.service.js'
import { EmailConflictException } from './exceptions/email-conflict.exception.js'
import { SelfActionException } from './exceptions/self-action.exception.js'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception.js'
import { AdminUserNotFoundException } from './exceptions/user-not-found.exception.js'

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
   * Joins users LEFT JOIN members + organizations for org info.
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

    // Organization filter
    if (filters.organizationId) {
      conditions.push(eq(members.organizationId, filters.organizationId))
    }

    // Search filter — ILIKE on name and email with escaping
    if (filters.search) {
      const escaped = filters.search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      const pattern = `%${escaped}%`
      conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!)
    }

    // Cursor condition
    if (cursor) {
      conditions.push(buildCursorCondition(cursor, users.createdAt, users.id))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await this.db
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
        orgName: organizations.name,
        orgId: organizations.id,
      })
      .from(users)
      .leftJoin(members, eq(users.id, members.userId))
      .leftJoin(organizations, eq(members.organizationId, organizations.id))
      .where(whereClause)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(limit + 1)

    return buildCursorResponse(
      rows,
      limit,
      (row) => row.createdAt,
      (row) => row.id
    )
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
      before: this.redactSensitiveFields(entry.before),
      after: this.redactSensitiveFields(entry.after),
    }))

    return { user, memberships, auditEntries: redactedEntries }
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

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'user.updated',
        resource: 'user',
        resourceId: userId,
        before: { ...beforeUser },
        after: { ...updatedUser },
      })
      .catch((err) => {
        this.logger.error(
          { correlationId: this.cls.getId(), action: 'user.updated', error: err.message },
          'Audit log write failed'
        )
        // TODO: Add metrics counter for audit failures (Phase 3)
      })

    return updatedUser
  }

  /**
   * Ban a user. Validates reason length (5-500 chars).
   */
  async banUser(userId: string, reason: string, expires: Date | null, actorId: string) {
    if (actorId === userId) {
      throw new SelfActionException()
    }

    // Validate reason length
    if (reason.length < 5 || reason.length > 500) {
      throw new Error('Ban reason must be between 5 and 500 characters')
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
      throw new AdminUserNotFoundException(userId)
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

  /**
   * Redact sensitive field values in audit log before/after data.
   * Matches field names case-insensitively against SENSITIVE_FIELDS.
   */
  private redactSensitiveFields(
    data: Record<string, unknown> | null
  ): Record<string, unknown> | null {
    if (data === null) {
      return null
    }

    const sensitiveSet = SENSITIVE_FIELDS.map((f) => f.toLowerCase())

    const redact = (obj: Record<string, unknown>): Record<string, unknown> => {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveSet.includes(key.toLowerCase())) {
          result[key] = '[REDACTED]'
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = redact(value as Record<string, unknown>)
        } else {
          result[key] = value
        }
      }
      return result
    }

    return redact(data)
  }
}
