import { eq } from 'drizzle-orm'
import type { DrizzleDB } from '../database/drizzle.provider.js'
import { organizations } from '../database/schema/auth.schema.js'
import { OrgCycleDetectedException } from './exceptions/org-cycle-detected.exception.js'
import { OrgDepthExceededException } from './exceptions/org-depth-exceeded.exception.js'

export const MAX_PARENT_WALK_ITERATIONS = 10

/**
 * Get the depth of an org by walking up the parent chain.
 * Depth = number of ancestors (edges to root).
 */
export async function getDepth(db: DrizzleDB, orgId: string): Promise<number> {
  let depth = 0
  let iterations = 0
  let currentId: string | null = orgId
  while (currentId) {
    if (iterations++ >= MAX_PARENT_WALK_ITERATIONS) break
    const [org] = await db
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
export async function validateHierarchy(
  db: DrizzleDB,
  orgId: string,
  newParentId: string
): Promise<void> {
  if (orgId === newParentId) {
    throw new OrgCycleDetectedException()
  }

  await db.transaction(async (tx) => {
    const { depth } = await walkParentChain(tx, orgId, newParentId)
    const subtreeDepth = await getSubtreeDepth(db, orgId)

    if (depth + 1 + subtreeDepth >= 3) {
      throw new OrgDepthExceededException()
    }
  })
}

/**
 * Walk up from startId, counting depth and detecting cycles against targetOrgId.
 */
export async function walkParentChain(
  tx: Parameters<Parameters<DrizzleDB['transaction']>[0]>[0],
  targetOrgId: string,
  startId: string
): Promise<{ depth: number }> {
  let depth = 0
  let iterations = 0
  let currentId: string | null = startId

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

    if (currentId === targetOrgId) {
      throw new OrgCycleDetectedException()
    }
  }

  return { depth }
}

/**
 * Get the depth of the deepest descendant below orgId.
 * Returns 0 if orgId has no children.
 */
export async function getSubtreeDepth(db: DrizzleDB, orgId: string): Promise<number> {
  const children = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.parentOrganizationId, orgId))

  if (children.length === 0) return 0

  let maxChildDepth = 0
  for (const child of children) {
    const childDepth = await getSubtreeDepth(db, child.id)
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
export async function getDescendantOrgIds(db: DrizzleDB, orgId: string): Promise<string[]> {
  const children = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.parentOrganizationId, orgId))

  const ids: string[] = []
  for (const child of children) {
    ids.push(child.id)
    const grandchildren = await getDescendantOrgIds(db, child.id)
    ids.push(...grandchildren)
    if (ids.length >= 1000) break // safety cap
  }
  return ids
}
