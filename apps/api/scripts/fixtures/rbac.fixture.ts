import { and, eq } from 'drizzle-orm'
import * as schema from '../../src/database/schema/index.js'
import type { DefaultRoleDefinition } from '../../src/rbac/rbac.constants.js'
import { DEFAULT_ROLES } from '../../src/rbac/rbac.constants.js'
import type { FixtureContext, Preset, SeedResult, Tx } from './types.js'

/** Build a map of "resource:action" -> permission ID from pre-seeded permissions. */
async function buildPermissionMap(tx: Tx): Promise<Map<string, string>> {
  const allPerms = await tx.select().from(schema.permissions)
  return new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]))
}

/** Resolve permission keys to IDs, logging warnings for missing entries. */
function resolvePermissionIds(
  roleDef: DefaultRoleDefinition,
  permMap: Map<string, string>
): string[] {
  const ids: string[] = []
  for (const permKey of roleDef.permissions) {
    const permissionId = permMap.get(permKey)
    if (!permissionId) {
      console.warn(`rbac.fixture: permission "${permKey}" not found — skipping`)
      continue
    }
    ids.push(permissionId)
  }
  return ids
}

/** Create default roles for a single org and return the slug-to-roleId map. */
async function seedRolesForOrg(
  tx: Tx,
  orgId: string,
  permMap: Map<string, string>
): Promise<{ slugToRoleId: Map<string, string>; roleCount: number; rolePermissionCount: number }> {
  const slugToRoleId = new Map<string, string>()
  let roleCount = 0
  let rolePermissionCount = 0

  for (const roleDef of DEFAULT_ROLES) {
    const roleId = crypto.randomUUID()
    await tx.insert(schema.roles).values({
      id: roleId,
      tenantId: orgId,
      name: roleDef.name,
      slug: roleDef.slug,
      description: roleDef.description,
      isDefault: true,
    })
    slugToRoleId.set(roleDef.slug, roleId)
    roleCount++

    const rolePermValues = resolvePermissionIds(roleDef, permMap).map((permissionId) => ({
      roleId,
      permissionId,
    }))

    if (rolePermValues.length > 0) {
      await tx.insert(schema.rolePermissions).values(rolePermValues)
      rolePermissionCount += rolePermValues.length
    }
  }

  return { slugToRoleId, roleCount, rolePermissionCount }
}

/** Back-patch member.roleId using in-memory context (no DB re-query). */
async function patchMemberRoles(
  tx: Tx,
  orgId: string,
  slugToRoleId: Map<string, string>,
  ctx: FixtureContext
): Promise<void> {
  const orgMembers = ctx.membersByOrg.get(orgId) ?? []

  for (const member of orgMembers) {
    const roleId = slugToRoleId.get(member.roleSlug)
    if (roleId) {
      await tx
        .update(schema.members)
        .set({ roleId })
        .where(and(eq(schema.members.id, member.id), eq(schema.members.organizationId, orgId)))
    }
  }
}

/**
 * Seed RBAC roles and role-permissions for each org, then back-patch
 * member.roleId based on matching role slugs.
 */
export async function seed(tx: Tx, _preset: Preset, ctx: FixtureContext): Promise<SeedResult> {
  const permMap = await buildPermissionMap(tx)
  if (permMap.size === 0) {
    console.warn('rbac.fixture: no permissions found — role-permission assignments will be skipped')
  }

  let roleCount = 0
  let rolePermissionCount = 0

  // Create default roles for each org
  for (const orgId of ctx.orgIds) {
    const result = await seedRolesForOrg(tx, orgId, permMap)
    ctx.roleIdsByOrg.set(orgId, result.slugToRoleId)
    roleCount += result.roleCount
    rolePermissionCount += result.rolePermissionCount
  }

  // Back-patch member.roleId
  for (const orgId of ctx.orgIds) {
    const slugToRoleId = ctx.roleIdsByOrg.get(orgId)
    if (slugToRoleId) {
      await patchMemberRoles(tx, orgId, slugToRoleId, ctx)
    }
  }

  return { roleCount, rolePermissionCount }
}
