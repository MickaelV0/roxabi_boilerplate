import type { DrizzleTx } from '../database/drizzle.provider.js'

export const RBAC_REPO = Symbol('RBAC_REPO')

export type RoleRow = {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export type PermissionRow = {
  id: string
  resource: string
  action: string
  description: string
}

export interface RbacRepository {
  listRoles(tx: DrizzleTx): Promise<RoleRow[]>

  findRoleBySlug(tenantId: string, slug: string, tx: DrizzleTx): Promise<{ id: string } | undefined>

  insertRole(
    data: {
      tenantId: string
      name: string
      slug: string
      description: string | null
      isDefault: boolean
    },
    tx: DrizzleTx
  ): Promise<RoleRow | undefined>

  checkSlugCollision(
    tenantId: string,
    slug: string,
    tx: DrizzleTx
  ): Promise<{ id: string } | undefined>

  findRoleById(roleId: string, tx: DrizzleTx): Promise<RoleRow | undefined>

  updateRole(roleId: string, updates: Record<string, unknown>, tx: DrizzleTx): Promise<void>

  deleteRolePermissions(roleId: string, tx: DrizzleTx): Promise<void>

  deleteRole(roleId: string, tx: DrizzleTx): Promise<void>

  findViewerRole(tenantId: string, tx: DrizzleTx): Promise<{ id: string } | undefined>

  reassignMembersToRole(fromRoleId: string, toRoleId: string, tx: DrizzleTx): Promise<void>

  getAllPermissions(tx: DrizzleTx): Promise<{ id: string; resource: string; action: string }[]>

  insertRolePermissions(
    inserts: { roleId: string; permissionId: string }[],
    tx: DrizzleTx
  ): Promise<void>

  getRolePermissions(roleId: string, tx: DrizzleTx): Promise<PermissionRow[]>

  seedDefaultRoles(
    organizationId: string,
    roles: {
      name: string
      slug: string
      description: string | null
      permissions: string[]
    }[],
    tx: DrizzleTx
  ): Promise<void>
}
