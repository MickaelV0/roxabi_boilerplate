import { Inject, Injectable, Logger } from '@nestjs/common'
import type { AuditAction } from '@repo/types'
import {
  and,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  isNull,
  max,
  or,
  type SQL,
} from 'drizzle-orm'
import { ClsService } from 'nestjs-cls'
import { AuditService } from '../audit/audit.service.js'
import {
  buildCursorCondition,
  buildCursorResponse,
} from '../common/utils/cursor-pagination.util.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { auditLogs } from '../database/schema/audit.schema.js'
import { members, organizations, users } from '../database/schema/auth.schema.js'
import { findUserSnapshotOrThrow } from './admin-users.shared.js'
import { EmailConflictException } from './exceptions/email-conflict.exception.js'
import { SelfActionException } from './exceptions/self-action.exception.js'
import { SuperadminProtectionException } from './exceptions/superadmin-protection.exception.js'
import { AdminUserNotFoundException } from './exceptions/user-not-found.exception.js'
import { redactSensitiveFields } from './utils/redact-sensitive-fields.js'

/**
 * AdminUsersService — cross-tenant user management for super admins.
 *
 * Handles: listUsers, getUserDetail, updateUser.
 *
 * Lifecycle state transitions (ban / unban / delete / restore) are in
 * AdminUsersLifecycleService.
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
    const conditions = this.buildUserFilterConditions(filters, cursor)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Query 1: Users only (no joins) — correct pagination without duplicates
    const userRows = await this.queryUserRows(whereClause, limit)

    // Build cursor response before fetching memberships (uses limit+1 logic)
    const paginatedResult = buildCursorResponse(
      userRows,
      limit,
      (row) => row.createdAt,
      (row) => row.id
    )

    // Query 2: Batch-fetch memberships for the page of users
    const userIds = paginatedResult.data.map((u) => u.id)
    const [membershipsByUserId, lastActiveByUserId] = await Promise.all([
      this.fetchMembershipsByUserIds(userIds),
      this.fetchLastActiveByUserIds(userIds),
    ])

    // Merge organizations, organizationCount, and lastActive onto each user
    const data = paginatedResult.data.map((user) => {
      const orgs = membershipsByUserId.get(user.id) ?? []
      return {
        ...user,
        organizations: orgs,
        organizationCount: orgs.length,
        lastActive: lastActiveByUserId.get(user.id) ?? null,
      }
    })

    return { data, cursor: paginatedResult.cursor }
  }

  private buildUserFilterConditions(
    filters: { role?: string; status?: string; organizationId?: string; search?: string },
    cursor?: string
  ): SQL[] {
    const conditions: SQL[] = []

    if (filters.role) {
      conditions.push(eq(users.role, filters.role))
    }

    if (filters.status === 'active') {
      conditions.push(eq(users.banned, false))
      conditions.push(isNull(users.deletedAt))
    } else if (filters.status === 'banned') {
      conditions.push(eq(users.banned, true))
    } else if (filters.status === 'archived') {
      conditions.push(isNotNull(users.deletedAt))
    }

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

    if (filters.search) {
      const escaped = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      const pattern = `%${escaped}%`
      const searchCondition = or(ilike(users.name, pattern), ilike(users.email, pattern))
      if (searchCondition) conditions.push(searchCondition)
    }

    if (cursor) {
      conditions.push(buildCursorCondition(cursor, users.createdAt, users.id))
    }

    return conditions
  }

  private queryUserRows(whereClause: SQL | undefined, limit: number) {
    return this.db
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
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(limit + 1)
  }

  private async fetchMembershipsByUserIds(
    userIds: string[]
  ): Promise<Map<string, { id: string; name: string; slug: string | null; role: string }[]>> {
    if (userIds.length === 0) return new Map()

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

    const map = new Map<string, { id: string; name: string; slug: string | null; role: string }[]>()
    for (const row of membershipRows) {
      const list = map.get(row.userId) ?? []
      list.push({ id: row.orgId, name: row.orgName, slug: row.orgSlug, role: row.role })
      map.set(row.userId, list)
    }
    return map
  }

  /**
   * Batch-fetch the most recent audit log timestamp per user (#312).
   * Returns a Map of userId → ISO timestamp string.
   *
   * Query: SELECT actorId, MAX(timestamp) FROM audit_logs WHERE actorId IN (:ids) GROUP BY actorId
   */
  private async fetchLastActiveByUserIds(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map()

    const rows = await this.db
      .select({
        actorId: auditLogs.actorId,
        lastActive: max(auditLogs.timestamp),
      })
      .from(auditLogs)
      .where(inArray(auditLogs.actorId, userIds))
      .groupBy(auditLogs.actorId)

    const map = new Map<string, string>()
    for (const row of rows) {
      if (row.lastActive) {
        map.set(row.actorId, row.lastActive.toISOString())
      }
    }
    return map
  }

  /**
   * Get detailed user info with org memberships and recent audit entries.
   */
  async getUserDetail(userId: string) {
    const user = await this.findUserDetailById(userId)

    if (!user) {
      throw new AdminUserNotFoundException(userId)
    }

    const [memberships, redactedEntries] = await Promise.all([
      this.fetchUserMemberships(userId),
      this.fetchUserAuditEntries(userId),
    ])

    return {
      ...user,
      lastActive: redactedEntries[0]?.timestamp ?? null,
      organizations: memberships.map((m) => ({
        id: m.orgId,
        name: m.orgName,
        slug: m.orgSlug,
        role: m.role,
      })),
      activitySummary: redactedEntries,
    }
  }

  private async findUserDetailById(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        deletedAt: users.deletedAt,
        deleteScheduledFor: users.deleteScheduledFor,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return user
  }

  private fetchUserMemberships(userId: string) {
    return this.db
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
  }

  private async fetchUserAuditEntries(userId: string) {
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

    return auditEntries.map((entry) => ({
      ...entry,
      before: redactSensitiveFields(entry.before),
      after: redactSensitiveFields(entry.after),
    }))
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
    const beforeUser = await findUserSnapshotOrThrow(this.db, userId)
    this.validateUpdatePermissions(data, actorId, userId, beforeUser.role ?? 'user')

    const updatedUser = await this.executeUserUpdate(userId, data)
    const auditAction =
      data.role && data.role !== beforeUser.role ? 'user.role_changed' : 'user.updated'

    this.logUserAudit(auditAction, userId, actorId, beforeUser, updatedUser)

    return updatedUser
  }

  private validateUpdatePermissions(
    data: { role?: string },
    actorId: string,
    userId: string,
    currentRole: string
  ) {
    if (data.role && actorId === userId) {
      throw new SelfActionException()
    }
    if (data.role && data.role !== 'superadmin' && currentRole === 'superadmin') {
      throw new SuperadminProtectionException()
    }
  }

  private async executeUserUpdate(
    userId: string,
    data: { name?: string; email?: string; role?: string }
  ) {
    try {
      const [result] = await this.db.update(users).set(data).where(eq(users.id, userId)).returning()
      if (!result) throw new AdminUserNotFoundException(userId)
      return result
    } catch (err) {
      const pgErr = err as { code?: string }
      if (pgErr.code === '23505') {
        throw new EmailConflictException()
      }
      throw err
    }
  }

  private logUserAudit(
    action: AuditAction,
    userId: string,
    actorId: string,
    before: Record<string, unknown> | undefined,
    after: Record<string, unknown> | undefined
  ) {
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action,
        resource: 'user',
        resourceId: userId,
        before: before ? { ...before } : null,
        after: after ? { ...after } : null,
      })
      .catch((err) => {
        this.logger.error(
          { correlationId: this.cls.getId(), action, error: err.message },
          'Audit log write failed'
        )
        // TODO: Add metrics counter for audit failures (Phase 3)
      })
  }
}
