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
import { NotDeletedException } from './exceptions/not-deleted.exception.js'
import { OrgCycleDetectedException } from './exceptions/org-cycle-detected.exception.js'
import { OrgDepthExceededException } from './exceptions/org-depth-exceeded.exception.js'
import { AdminOrgNotFoundException } from './exceptions/org-not-found.exception.js'
import { OrgSlugConflictException } from './exceptions/org-slug-conflict.exception.js'

const MAX_PARENT_WALK_ITERATIONS = 10

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
      const escaped = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      const pattern = `%${escaped}%`
      const searchCondition = or(
        ilike(organizations.name, pattern),
        ilike(organizations.slug, pattern)
      )
      if (searchCondition) conditions.push(searchCondition)
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
        updatedAt: organizations.updatedAt,
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

    if (countResult?.count > 1000) {
      return {
        treeViewAvailable: false,
        data: [] as {
          id: string
          name: string
          slug: string | null
          parentOrganizationId: string | null
          memberCount: number
        }[],
      }
    }

    // Fetch all non-deleted orgs with member counts
    const rows = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        parentOrganizationId: organizations.parentOrganizationId,
        memberCount: count(members.id),
      })
      .from(organizations)
      .leftJoin(members, eq(organizations.id, members.organizationId))
      .where(isNull(organizations.deletedAt))
      .groupBy(organizations.id)

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
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)

    if (!organization) {
      throw new AdminOrgNotFoundException(orgId)
    }

    // 2. Parent organization (if exists)
    let parentOrganization: { id: string; name: string; slug: string | null } | null = null
    if (organization.parentOrganizationId) {
      const [parent] = await this.db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        })
        .from(organizations)
        .where(eq(organizations.id, organization.parentOrganizationId))
        .limit(1)
      parentOrganization = parent ?? null
    }

    // 3. Members (join members + users)
    const orgMembers = await this.db
      .select({
        id: members.id,
        name: users.name,
        email: users.email,
        role: members.role,
        createdAt: members.createdAt,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.organizationId, orgId))

    // 4. Children (orgs where parentOrganizationId = orgId)
    const childOrgs = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        parentOrganizationId: organizations.parentOrganizationId,
        memberCount: count(members.id),
      })
      .from(organizations)
      .leftJoin(members, eq(organizations.id, members.organizationId))
      .where(eq(organizations.parentOrganizationId, orgId))
      .groupBy(organizations.id)

    return {
      ...organization,
      memberCount: orgMembers.length,
      childCount: childOrgs.length,
      parentOrganization,
      members: orgMembers,
      children: childOrgs,
    }
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
      if (!result) throw new AdminOrgNotFoundException('insert returned no rows')
      createdOrg = result
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
        action: 'org.created',
        resource: 'organization',
        resourceId: createdOrg.id,
        organizationId: createdOrg.id,
        after: { ...createdOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log org.created`, err)
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
      if (!result) throw new AdminOrgNotFoundException(orgId)
      updatedOrg = result
    } catch (err) {
      const pgErr = err as { code?: string }
      if (pgErr.code === '23505') {
        throw new OrgSlugConflictException()
      }
      throw err
    }

    // Determine audit action: use 'org.parent_changed' for reparent, 'org.updated' otherwise
    const auditAction =
      data.parentOrganizationId !== undefined &&
      data.parentOrganizationId !== beforeOrg.parentOrganizationId
        ? 'org.parent_changed'
        : 'org.updated'

    // Fire-and-forget audit log
    this.auditService
      .log({
        actorId,
        actorType: 'user',
        action: auditAction,
        resource: 'organization',
        resourceId: orgId,
        organizationId: orgId,
        before: { ...beforeOrg },
        after: { ...updatedOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log ${auditAction}`, err)
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

    // Active members: not deleted and not banned
    const [activeMembersResult] = await this.db
      .select({ count: count() })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(
        and(eq(members.organizationId, orgId), isNull(users.deletedAt), eq(users.banned, false))
      )

    // Child org count (direct children only)
    const [childOrgCountResult] = await this.db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.parentOrganizationId, orgId))

    // Collect all descendant org IDs recursively for child member count
    const descendantIds = await this.getDescendantOrgIds(orgId)

    // Child member count (members in ALL descendant orgs)
    let childMemberCount = 0
    if (descendantIds.length > 0) {
      const [childMemberCountResult] = await this.db
        .select({ count: count() })
        .from(members)
        .where(inArray(members.organizationId, descendantIds))
      childMemberCount = childMemberCountResult?.count
    }

    return {
      memberCount: memberCountResult?.count,
      activeMembers: activeMembersResult?.count,
      childOrgCount: childOrgCountResult?.count,
      childMemberCount,
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

    if (org.deletedAt) {
      throw new NotDeletedException('Organization', orgId)
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
        action: 'org.deleted',
        resource: 'organization',
        resourceId: orgId,
        organizationId: orgId,
        before: { ...org },
        after: { ...updatedOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log org.deleted`, err)
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
      throw new NotDeletedException('Organization', orgId)
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
        action: 'org.restored',
        resource: 'organization',
        resourceId: orgId,
        organizationId: orgId,
        before: { ...org },
        after: { ...updatedOrg },
      })
      .catch((err) => {
        this.logger.error(`[${this.cls.getId()}][audit] Failed to log org.restored`, err)
      })

    return updatedOrg
  }

  /**
   * Get the depth of an org by walking up the parent chain.
   * Depth = number of ancestors (edges to root).
   */
  private async getDepth(orgId: string): Promise<number> {
    let depth = 0
    let iterations = 0
    let currentId: string | null = orgId
    while (currentId) {
      if (iterations++ >= MAX_PARENT_WALK_ITERATIONS) break
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
    // Self-parent guard
    if (orgId === newParentId) {
      throw new OrgCycleDetectedException()
    }

    await this.db.transaction(async (tx) => {
      let depth = 0
      let iterations = 0
      let currentId: string | null = newParentId
      while (currentId) {
        if (iterations++ >= MAX_PARENT_WALK_ITERATIONS) break
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

      // Also compute subtree depth of the org being moved
      const subtreeDepth = await this.getSubtreeDepth(orgId)

      // Check depth: parent chain depth + 1 (for orgId itself) + subtree depth
      if (depth + 1 + subtreeDepth >= 3) {
        throw new OrgDepthExceededException()
      }
    })
  }

  /**
   * Get the depth of the deepest descendant below orgId.
   * Returns 0 if orgId has no children.
   */
  private async getSubtreeDepth(orgId: string): Promise<number> {
    const children = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.parentOrganizationId, orgId))

    if (children.length === 0) return 0

    let maxChildDepth = 0
    for (const child of children) {
      const childDepth = await this.getSubtreeDepth(child.id)
      if (childDepth + 1 > maxChildDepth) {
        maxChildDepth = childDepth + 1
      }
      if (maxChildDepth >= MAX_PARENT_WALK_ITERATIONS) break
    }
    return maxChildDepth
  }

  /**
   * Collect all descendant org IDs recursively (for deletion impact).
   */
  private async getDescendantOrgIds(orgId: string): Promise<string[]> {
    const children = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.parentOrganizationId, orgId))

    const ids: string[] = []
    for (const child of children) {
      ids.push(child.id)
      const grandchildren = await this.getDescendantOrgIds(child.id)
      ids.push(...grandchildren)
      if (ids.length >= 1000) break // safety cap
    }
    return ids
  }
}
