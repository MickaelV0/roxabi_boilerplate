import type { DrizzleTx } from '../database/drizzle.provider.js'

export const RBAC_MEMBER_REPO = Symbol('RBAC_MEMBER_REPO')

export type MemberRow = {
  id: string
  userId: string
  organizationId: string
  roleId: string | null
  role: string | null
  createdAt: Date
  updatedAt: Date
}

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

export interface RbacMemberRepository {
  findDefaultRoles(tenantId: string, tx: DrizzleTx): Promise<{ id: string; slug: string }[]>

  findMemberByUserAndOrg(
    userId: string,
    organizationId: string,
    roleId: string,
    tx: DrizzleTx
  ): Promise<{ id: string } | undefined>

  findMemberByIdAndOrg(
    memberId: string,
    organizationId: string,
    roleId: string,
    tx: DrizzleTx
  ): Promise<{ id: string } | undefined>

  updateMemberRole(memberId: string, roleId: string, tx: DrizzleTx): Promise<void>

  findRoleInTenant(roleId: string, tenantId: string, tx: DrizzleTx): Promise<RoleRow | undefined>

  findMemberInOrg(
    memberId: string,
    organizationId: string,
    tx: DrizzleTx
  ): Promise<MemberRow | undefined>

  findRoleById(roleId: string, tx: DrizzleTx): Promise<RoleRow | undefined>

  countMembersWithRole(organizationId: string, roleId: string, tx: DrizzleTx): Promise<number>
}
