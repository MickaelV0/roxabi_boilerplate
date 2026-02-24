import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, count, desc, eq, ilike, inArray, isNotNull, isNull, or, type SQL } from 'drizzle-orm'
import { ClsService } from 'nestjs-cls'
import { AuditService } from '../audit/audit.service.js'
import {
  buildCursorCondition,
  buildCursorResponse,
} from '../common/utils/cursor-pagination.util.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { members, organizations, users } from '../database/schema/auth.schema.js'
import { OrgCycleDetectedException } from './exceptions/org-cycle-detected.exception.js'
import { OrgDepthExceededException } from './exceptions/org-depth-exceeded.exception.js'
import { AdminOrgNotFoundException } from './exceptions/org-not-found.exception.js'
import { OrgSlugConflictException } from './exceptions/org-slug-conflict.exception.js'

/**
 * AdminOrganizationsService — cross-tenant org management for super admins.
 *
 * Uses raw DRIZZLE connection (not TenantService) for cross-tenant access.
 *
 * WARNING: The raw DRIZZLE connection bypasses all RLS policies.
 */
@Injectable()
export class AdminOrganizationsService {
  private readonly logger = new Logger(AdminOrganizationsService.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService,
    private readonly cls: ClsService
  ) {}

  /**
   * List organizations with cursor-based pagination and optional filters.
   * Includes memberCount via correlated subquery.
   */
  async listOrganizations(
    filters: { status?: string; search?: string },
    cursor?: string,
    limit = 20
  ) {
    const conditions: SQL[] = []

    // Status filter
    if (filters.status === 'active') {
      conditions.push(isNull(organizations.deletedAt))
    } else if (filters.status === 'archived') {
      conditions.push(isNotNull(organizations.deletedAt))
    }

    // Search filter — ILIKE on name or slug
    if (filters.search) {
      const escaped = filters.search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      const pattern = `%${escaped}%`
      conditions.push(or(ilike(organizations.name, pattern), ilike(organizations.slug, pattern))!)
    }

    // Cursor condition
    if (cursor) {
      conditions.push(buildCursorCondition(cursor, organizations.createdAt, organizations.id))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        metadata: organizations.metadata,
        parentOrganizationId: organizations.parentOrganizationId,
        deletedAt: organizations.deletedAt,
        deleteScheduledFor: organizations.deleteScheduledFor,
        createdAt: organizations.createdAt,
        memberCount: count(members.id),
      })
      .from(organizations)
      .leftJoin(members, eq(organizations.id, members.organizationId))
      .where(whereClause)
      .groupBy(organizations.id)
      .orderBy(desc(organizations.createdAt), desc(organizations.id))
      .limit(limit + 1)

    return buildCursorResponse(
      rows,
      limit,
      (row) => row.createdAt,
      (row) => row.id
    )
  }

  /**
   * List all non-deleted organizations for tree view.
   * Returns treeViewAvailable=false if > 1000 orgs.
   */
  async listOrganizationsForTree() {
    // Count query
    const [countResult] = await this.db
      .select({ count: count() })
      .from(organizations)
      .where(isNull(organizations.deletedAt))

    if (countResult!.count > 1000) {
      return {
        treeViewAvailable: false,
        data: [] as {
          id: string
          name: string
          slug: string | null
          parentOrganizationId: string | null
        }[],
      }
    }

    // Fetch all non-deleted orgs
    const rows = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        parentOrganizationId: organizations.parentOrganizationId,
      })
      .from(organizations)
      .where(isNull(organizations.deletedAt))

    return { treeViewAvailable: true, data: rows }
  }

  /**
   * Get detailed org info with members and child organizations.
   */
  async getOrganizationDetail(orgId: string) {
    // 1. Org lookup
    const [organization] = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        metadata: organizations.metadata,
        parentOrganizationId: organizations.parentOrganizationId,
        deletedAt: organizations.deletedAt,
        deleteScheduledFor: organizations.deleteScheduledFor,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)

    if (!organization) {
      throw new AdminOrgNotFoundException(orgId)
    }

    // 2. Members (join members + users)
    const orgMembers = await this.db
      .select({
        memberId: members.id,
        userId: users.id,
        userName: users.name,
        email: users.email,
        role: members.role,
        joinedAt: members.createdAt,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.organizationId, orgId))

    // 3. Children (orgs where parentOrganizationId = orgId)
    const children = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        parentOrganizationId: organizations.parentOrganizationId,
      })
      .from(organizations)
      .where(eq(organizations.parentOrganizationId, orgId))

    return { organization, members: orgMembers, children }
  }

  /**
   * Create a new organization. Validates parent depth.
   */
  async createOrganization(
    data: { name: string; slug: string; parentOrganizationId?: string | null },
    actorId: string
  ) {
    // Validate parent depth if parentOrganizationId is provided
    if (data.parentOrganizationId) {
      const depth = await this.getDepth(data.parentOrganizationId)
      if (depth + 1 >= 3) {
        throw new OrgDepthExceededException()
      }
    }

    // Insert the organization
    let createdOrg: typeof organizations.$inferSelect
    try {
      const [result] = await this.db
        .insert(organizations)
        .values({
          name: data.name,
          slug: data.slug,
          parentOrganizationId: data.parentOrganizationId ?? null,
        })
        .returning()
      createdOrg = result!
    } catch (err) {
      const pgErr = err as { code?: string }
      if (pgErr.code === '23505') {
        throw new OrgSlugConflictException()
      }
      throw err
    }

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'organization.created',
        resource: 'organization',
        resourceId: createdOrg.id,
        after: { ...createdOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log organization.created`, err)
      })

    return createdOrg
  }

  /**
   * Update an organization. Validates hierarchy on reparent.
   */
  async updateOrganization(
    orgId: string,
    data: { name?: string; slug?: string; parentOrganizationId?: string | null },
    actorId: string
  ) {
    // Read before-state
    const [beforeOrg] = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        metadata: organizations.metadata,
        parentOrganizationId: organizations.parentOrganizationId,
        deletedAt: organizations.deletedAt,
        deleteScheduledFor: organizations.deleteScheduledFor,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)

    if (!beforeOrg) {
      throw new AdminOrgNotFoundException(orgId)
    }

    // If parentOrganizationId is being changed, validate hierarchy
    if (data.parentOrganizationId !== undefined && data.parentOrganizationId !== null) {
      await this.validateHierarchy(orgId, data.parentOrganizationId)
    }

    // Perform the update
    let updatedOrg: typeof organizations.$inferSelect
    try {
      const [result] = await this.db
        .update(organizations)
        .set(data)
        .where(eq(organizations.id, orgId))
        .returning()
      updatedOrg = result!
    } catch (err) {
      const pgErr = err as { code?: string }
      if (pgErr.code === '23505') {
        throw new OrgSlugConflictException()
      }
      throw err
    }

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'organization.updated',
        resource: 'organization',
        resourceId: orgId,
        before: { ...beforeOrg },
        after: { ...updatedOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log organization.updated`, err)
      })

    return updatedOrg
  }

  /**
   * Preview the impact of deleting an organization.
   */
  async getDeletionImpact(orgId: string) {
    // Org lookup
    const [org] = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)

    if (!org) {
      throw new AdminOrgNotFoundException(orgId)
    }

    // Member count
    const [memberCountResult] = await this.db
      .select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, orgId))

    // Child org count
    const [childOrgCountResult] = await this.db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.parentOrganizationId, orgId))

    // Child member count (members in child orgs)
    const [childMemberCountResult] = await this.db
      .select({ count: count() })
      .from(members)
      .where(
        inArray(
          members.organizationId,
          this.db
            .select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.parentOrganizationId, orgId))
        )
      )

    return {
      memberCount: memberCountResult!.count,
      childOrgCount: childOrgCountResult!.count,
      childMemberCount: childMemberCountResult!.count,
    }
  }

  /**
   * Soft-delete an organization — set deletedAt and deleteScheduledFor.
   */
  async deleteOrganization(orgId: string, actorId: string) {
    // Read current org
    const [org] = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        metadata: organizations.metadata,
        parentOrganizationId: organizations.parentOrganizationId,
        deletedAt: organizations.deletedAt,
        deleteScheduledFor: organizations.deleteScheduledFor,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)

    if (!org) {
      throw new AdminOrgNotFoundException(orgId)
    }

    const now = new Date()
    const scheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Update deletion fields
    const [updatedOrg] = await this.db
      .update(organizations)
      .set({
        deletedAt: now,
        deleteScheduledFor: scheduledFor,
      })
      .where(eq(organizations.id, orgId))
      .returning()

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'organization.deleted',
        resource: 'organization',
        resourceId: orgId,
        before: { ...org },
        after: { ...updatedOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log organization.deleted`, err)
      })

    return updatedOrg
  }

  /**
   * Restore a soft-deleted organization — clear deletedAt and deleteScheduledFor.
   */
  async restoreOrganization(orgId: string, actorId: string) {
    // Read current org
    const [org] = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        metadata: organizations.metadata,
        parentOrganizationId: organizations.parentOrganizationId,
        deletedAt: organizations.deletedAt,
        deleteScheduledFor: organizations.deleteScheduledFor,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)

    if (!org) {
      throw new AdminOrgNotFoundException(orgId)
    }

    // Verify org is actually deleted
    if (!org.deletedAt) {
      throw new AdminOrgNotFoundException(orgId)
    }

    // Clear deletion fields
    const [updatedOrg] = await this.db
      .update(organizations)
      .set({
        deletedAt: null,
        deleteScheduledFor: null,
      })
      .where(eq(organizations.id, orgId))
      .returning()

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: 'organization.restored',
        resource: 'organization',
        resourceId: orgId,
        before: { ...org },
        after: { ...updatedOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log organization.restored`, err)
      })

    return updatedOrg
  }

  /**
   * Get the depth of an org by walking up the parent chain.
   * Depth = number of ancestors (edges to root).
   */
  private async getDepth(orgId: string): Promise<number> {
    let depth = 0
    let currentId: string | null = orgId
    while (currentId) {
      const [org] = await this.db
        .select({ parentOrganizationId: organizations.parentOrganizationId })
        .from(organizations)
        .where(eq(organizations.id, currentId))
        .limit(1)
      if (!org) break
      currentId = org.parentOrganizationId
      if (currentId) depth++
    }
    return depth
  }

  /**
   * Validate hierarchy when reparenting: check for cycles and max depth.
   * Walks up from newParentId, checking each node.
   */
  private async validateHierarchy(orgId: string, newParentId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      let depth = 0
      let currentId: string | null = newParentId
      while (currentId) {
        const [org] = await tx
          .select({
            id: organizations.id,
            parentOrganizationId: organizations.parentOrganizationId,
          })
          .from(organizations)
          .where(eq(organizations.id, currentId))
          .limit(1)
        if (!org) break

        currentId = org.parentOrganizationId
        if (currentId) depth++

        // Check for cycle: if we encounter the org being updated in the chain
        if (currentId === orgId) {
          throw new OrgCycleDetectedException()
        }
      }

      // Check depth: adding orgId as child of newParent
      if (depth + 1 >= 3) {
        throw new OrgDepthExceededException()
      }
    })
  }
}
