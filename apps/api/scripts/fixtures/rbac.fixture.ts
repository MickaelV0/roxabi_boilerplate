import { and, eq } from 'drizzle-orm'
import * as schema from '../../src/database/schema/index.js'
import type { DefaultRoleDefinition } from '../../src/rbac/rbac.constants.js'
import { DEFAULT_ROLES } from '../../src/rbac/rbac.constants.js'
import type { FixtureContext, Tx } from './types.js'

/** Build a map of "resource:action" -> permission ID from pre-seeded permissions. */
async function buildPermissionMap(tx: Tx): Promise<Map<string, string>> {
  const allPerms = await tx.select().from(schema.permissions)
  return new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]))
}

/** Resolve permission keys to IDs, logging warnings for missing entries. */
function resolvePermissions(
  roleDef: DefaultRoleDefinition,
  permMap: Map<string, string>
): { roleId: string; permissionId: string }[] {
  const roleId = '' // placeholder — caller sets actual roleId
  const values: { roleId: string; permissionId: string }[] = []
  for (const permKey of roleDef.permissions) {
    const permissionId = permMap.get(permKey)
    if (!permissionId) {
      console.warn(`rbac.fixture: permission "${permKey}" not found — skipping`)
      continue
    }
    values.push({ roleId, permissionId })
  }
  return values
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

    const rolePermValues = resolvePermissions(roleDef, permMap).map((v) => ({
      ...v,
      roleId,
    }))

    if (rolePermValues.length > 0) {
      await tx.insert(schema.rolePermissions).values(rolePermValues)
      rolePermissionCount += rolePermValues.length
    }
  }

  return { slugToRoleId, roleCount, rolePermissionCount }
}

/** Back-patch member.roleId for all members in a single org. */
async function patchMemberRoles(
  tx: Tx,
  orgId: string,
  slugToRoleId: Map<string, string>
): Promise<void> {
  const orgMembers = await tx
    .select({ id: schema.members.id, role: schema.members.role })
    .from(schema.members)
    .where(eq(schema.members.organizationId, orgId))

  for (const member of orgMembers) {
    const roleId = slugToRoleId.get(member.role)
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
export async function seed(
  tx: Tx,
  _preset: unknown,
  ctx: FixtureContext
): Promise<{ roleCount: number; rolePermissionCount: number }> {
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
      await patchMemberRoles(tx, orgId, slugToRoleId)
    }
  }

  return { roleCount, rolePermissionCount }
}
