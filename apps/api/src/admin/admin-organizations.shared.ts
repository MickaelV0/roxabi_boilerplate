import { eq } from 'drizzle-orm'
import type { DrizzleDB } from '../database/drizzle.provider.js'
import { organizations } from '../database/schema/auth.schema.js'
import { AdminOrgNotFoundException } from './exceptions/org-not-found.exception.js'

/**
 * Fetch an organization snapshot or throw AdminOrgNotFoundException.
 *
 * Shared between AdminOrganizationsService (update) and
 * AdminOrganizationsDeletionService (delete / restore).
 */
export async function findOrgSnapshotOrThrow(db: DrizzleDB, orgId: string) {
  const [org] = await db
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
  return org
}
