import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm'
import {
  buildCursorCondition,
  buildCursorResponse,
} from '../common/utils/cursor-pagination.util.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { auditLogs } from '../database/schema/audit.schema.js'
import { users } from '../database/schema/auth.schema.js'
import { redactSensitiveFields } from './utils/redact-sensitive-fields.js'

/**
 * AdminAuditLogsService -- audit log query and redaction for super admins.
 *
 * Uses raw DRIZZLE connection for cross-tenant access.
 */
@Injectable()
export class AdminAuditLogsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * List audit log entries with cursor-based pagination and optional filters.
   * Joins users for actor name. Redacts sensitive fields in before/after data.
   */
  async listAuditLogs(
    filters: {
      from?: Date
      to?: Date
      actorId?: string
      action?: string
      resource?: string
      organizationId?: string
      search?: string
    },
    cursor?: string,
    limit = 20
  ) {
    const conditions: SQL[] = []

    // Date range filters
    if (filters.from) {
      conditions.push(gte(auditLogs.timestamp, filters.from))
    }
    if (filters.to) {
      conditions.push(lte(auditLogs.timestamp, filters.to))
    }

    // Actor filter
    if (filters.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId))
    }

    // Action filter
    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action))
    }

    // Resource filter
    if (filters.resource) {
      conditions.push(eq(auditLogs.resource, filters.resource))
    }

    // Organization filter
    if (filters.organizationId) {
      conditions.push(eq(auditLogs.organizationId, filters.organizationId))
    }

    // Search filter -- ILIKE on action, resource, resourceId
    if (filters.search) {
      const escaped = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      const pattern = `%${escaped}%`
      const searchCondition = or(
        ilike(auditLogs.action, pattern),
        ilike(auditLogs.resource, pattern),
        ilike(auditLogs.resourceId, pattern)
      )
      if (searchCondition) conditions.push(searchCondition)
    }

    // Cursor condition
    if (cursor) {
      conditions.push(buildCursorCondition(cursor, auditLogs.timestamp, auditLogs.id))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await this.db
      .select({
        id: auditLogs.id,
        timestamp: auditLogs.timestamp,
        actorId: auditLogs.actorId,
        actorType: auditLogs.actorType,
        actorName: users.name,
        impersonatorId: auditLogs.impersonatorId,
        organizationId: auditLogs.organizationId,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        before: auditLogs.before,
        after: auditLogs.after,
        metadata: auditLogs.metadata,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp), desc(auditLogs.id))
      .limit(limit + 1)

    // Map results: fallback actor name + redact sensitive fields
    const mapped = rows.map((row) => ({
      ...row,
      actorName: row.actorName ?? '[Deleted User]',
      before: redactSensitiveFields(row.before ?? null),
      after: redactSensitiveFields(row.after ?? null),
    }))

    return buildCursorResponse(
      mapped,
      limit,
      (row) => row.timestamp,
      (row) => row.id
    )
  }

  /**
   * Delegates to shared redactSensitiveFields utility.
   * Kept as public instance method for backward compatibility with existing callers.
   */
  redactSensitiveFields(data: Record<string, unknown> | null): Record<string, unknown> | null {
    return redactSensitiveFields(data)
  }
}
