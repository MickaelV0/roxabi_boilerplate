import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { ClsService } from 'nestjs-cls'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { members } from '../database/schema/auth.schema.js'
import { permissions, rolePermissions, roles } from '../database/schema/rbac.schema.js'
import { TenantService } from '../tenant/tenant.service.js'
import { OwnershipConstraintException } from './exceptions/ownership-constraint.exception.js'
import { RoleNotFoundException } from './exceptions/role-not-found.exception.js'

type DefaultRoleDefinition = {
  name: string
  slug: string
  description: string
  permissions: string[]
}

const DEFAULT_ROLES: DefaultRoleDefinition[] = [
  {
    name: 'Owner',
    slug: 'owner',
    description: 'Full access — organization owner',
    permissions: [
      'users:read',
      'users:write',
      'users:delete',
      'organizations:read',
      'organizations:write',
      'organizations:delete',
      'members:read',
      'members:write',
      'members:delete',
      'invitations:read',
      'invitations:write',
      'invitations:delete',
      'roles:read',
      'roles:write',
      'roles:delete',
    ],
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Manage members, roles, and invitations',
    permissions: [
      'users:read',
      'users:write',
      'organizations:read',
      'organizations:write',
      'members:read',
      'members:write',
      'members:delete',
      'invitations:read',
      'invitations:write',
      'invitations:delete',
      'roles:read',
      'roles:write',
      'roles:delete',
    ],
  },
  {
    name: 'Member',
    slug: 'member',
    description: 'Standard member access',
    permissions: [
      'users:read',
      'organizations:read',
      'members:read',
      'invitations:read',
      'roles:read',
    ],
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access',
    permissions: ['users:read', 'organizations:read', 'members:read', 'roles:read'],
  },
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

@Injectable()
export class RbacService {
  constructor(
    private readonly tenantService: TenantService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly cls: ClsService
  ) {}

  /**
   * List all roles for the current tenant organization.
   */
  async listRoles() {
    return this.tenantService.query((tx) => tx.select().from(roles))
  }

  /**
   * Create a custom role for the current tenant organization.
   */
  async createRole(data: { name: string; description?: string; permissions: string[] }) {
    const slug = slugify(data.name)
    const tenantId = this.cls.get('tenantId') as string

    return this.tenantService.query(async (tx) => {
      // Check for slug collision
      const existing = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.tenantId, tenantId), eq(roles.slug, slug)))
        .limit(1)

      if (existing.length > 0) {
        throw new ConflictException(`Role with slug "${slug}" already exists`)
      }

      // Insert the role
      const [role] = await tx
        .insert(roles)
        .values({
          tenantId,
          name: data.name,
          slug,
          description: data.description ?? null,
          isDefault: false,
        })
        .returning()

      if (!role) throw new Error('Failed to insert role')

      // Resolve permission IDs from permission strings
      if (data.permissions.length > 0) {
        const allPerms = await tx.select().from(permissions)
        const permMap = new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]))

        const permissionInserts = data.permissions
          .map((perm) => ({
            roleId: role.id,
            permissionId: permMap.get(perm),
          }))
          .filter((entry): entry is { roleId: string; permissionId: string } =>
            Boolean(entry.permissionId)
          )

        if (permissionInserts.length > 0) {
          await tx.insert(rolePermissions).values(permissionInserts)
        }
      }

      return role
    })
  }

  /**
   * Update a role's fields and/or permissions.
   */
  async updateRole(
    roleId: string,
    data: { name?: string; description?: string; permissions?: string[] }
  ) {
    return this.tenantService.query(async (tx) => {
      const existing = await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1)

      if (existing.length === 0) {
        throw new RoleNotFoundException(roleId)
      }

      // Update role fields
      const updates: Record<string, unknown> = {}
      if (data.name !== undefined) {
        updates.name = data.name
        updates.slug = slugify(data.name)
      }
      if (data.description !== undefined) {
        updates.description = data.description
      }

      if (Object.keys(updates).length > 0) {
        await tx.update(roles).set(updates).where(eq(roles.id, roleId))
      }

      // Re-sync permissions if provided
      if (data.permissions) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

        if (data.permissions.length > 0) {
          const allPerms = await tx.select().from(permissions)
          const permMap = new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]))

          const permissionInserts = data.permissions
            .map((perm) => ({
              roleId,
              permissionId: permMap.get(perm),
            }))
            .filter((entry): entry is { roleId: string; permissionId: string } =>
              Boolean(entry.permissionId)
            )

          if (permissionInserts.length > 0) {
            await tx.insert(rolePermissions).values(permissionInserts)
          }
        }
      }

      // Return updated role
      const [updated] = await tx.select().from(roles).where(eq(roles.id, roleId))
      return updated
    })
  }

  /**
   * Delete a custom role. Members fallback to Viewer.
   */
  async deleteRole(roleId: string) {
    return this.tenantService.query(async (tx) => {
      const existing = await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1)

      const role = existing[0]
      if (!role) {
        throw new RoleNotFoundException(roleId)
      }

      if (role.isDefault) {
        throw new OwnershipConstraintException('Cannot delete a default role')
      }

      // Find the Viewer role to reassign members
      const [viewerRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.tenantId, role.tenantId), eq(roles.slug, 'viewer')))
        .limit(1)

      // Reassign members to Viewer (members table is not RLS-scoped, use db directly)
      if (viewerRole) {
        await this.db
          .update(members)
          .set({ roleId: viewerRole.id })
          .where(eq(members.roleId, roleId))
      }

      // Delete the role (role_permissions cascade)
      await tx.delete(roles).where(eq(roles.id, roleId))

      return { deleted: true }
    })
  }

  /**
   * Get permissions assigned to a specific role.
   */
  async getRolePermissions(roleId: string) {
    return this.tenantService.query(async (tx) => {
      const existing = await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1)

      if (existing.length === 0) {
        throw new RoleNotFoundException(roleId)
      }

      const rows = await tx
        .select({
          id: permissions.id,
          resource: permissions.resource,
          action: permissions.action,
          description: permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId))

      return rows
    })
  }

  /**
   * Transfer ownership from current Owner to another Admin.
   */
  async transferOwnership(currentUserId: string, targetMemberId: string) {
    const tenantId = this.cls.get('tenantId') as string

    return this.tenantService.query(async (tx) => {
      // Find Owner and Admin roles
      const defaultRoles = await tx
        .select()
        .from(roles)
        .where(and(eq(roles.tenantId, tenantId), eq(roles.isDefault, true)))

      const ownerRole = defaultRoles.find((r) => r.slug === 'owner')
      const adminRole = defaultRoles.find((r) => r.slug === 'admin')

      if (!ownerRole || !adminRole) {
        throw new OwnershipConstraintException('Default roles not found')
      }

      // Verify current user is Owner
      const [currentMember] = await this.db
        .select()
        .from(members)
        .where(
          and(
            eq(members.userId, currentUserId),
            eq(members.organizationId, tenantId),
            eq(members.roleId, ownerRole.id)
          )
        )
        .limit(1)

      if (!currentMember) {
        throw new OwnershipConstraintException('Only the Owner can transfer ownership')
      }

      // Verify target is an Admin
      const [targetMember] = await this.db
        .select()
        .from(members)
        .where(
          and(
            eq(members.id, targetMemberId),
            eq(members.organizationId, tenantId),
            eq(members.roleId, adminRole.id)
          )
        )
        .limit(1)

      if (!targetMember) {
        throw new OwnershipConstraintException('Target must be an Admin in the same organization')
      }

      // Swap: current Owner → Admin, target Admin → Owner
      await this.db
        .update(members)
        .set({ roleId: adminRole.id })
        .where(eq(members.id, currentMember.id))

      await this.db
        .update(members)
        .set({ roleId: ownerRole.id })
        .where(eq(members.id, targetMember.id))

      return { transferred: true }
    })
  }

  /**
   * Change a member's role within the organization.
   */
  async changeMemberRole(memberId: string, roleId: string) {
    const tenantId = this.cls.get('tenantId') as string

    return this.tenantService.query(async (tx) => {
      // Verify role exists in tenant
      const [role] = await tx
        .select()
        .from(roles)
        .where(and(eq(roles.id, roleId), eq(roles.tenantId, tenantId)))
        .limit(1)

      if (!role) {
        throw new RoleNotFoundException(roleId)
      }

      // Get the member being changed
      const [member] = await this.db
        .select()
        .from(members)
        .where(and(eq(members.id, memberId), eq(members.organizationId, tenantId)))
        .limit(1)

      if (!member) {
        throw new RoleNotFoundException(memberId)
      }

      // Check if removing last Owner
      if (member.roleId) {
        const [currentRole] = await tx
          .select()
          .from(roles)
          .where(eq(roles.id, member.roleId))
          .limit(1)

        if (currentRole?.slug === 'owner' && role.slug !== 'owner') {
          // Count Owners
          const ownerMembers = await this.db
            .select({ id: members.id })
            .from(members)
            .where(and(eq(members.organizationId, tenantId), eq(members.roleId, currentRole.id)))

          if (ownerMembers.length <= 1) {
            throw new OwnershipConstraintException(
              'Cannot remove the last Owner — transfer ownership first'
            )
          }
        }
      }

      await this.db.update(members).set({ roleId }).where(eq(members.id, memberId))

      return { updated: true }
    })
  }

  /**
   * Seed default roles for a newly created organization.
   * Called on org creation event.
   */
  async seedDefaultRoles(organizationId: string) {
    // Load all global permissions
    const allPerms = await this.db.select().from(permissions)
    const permMap = new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]))

    await this.tenantService.queryAs(organizationId, async (tx) => {
      for (const def of DEFAULT_ROLES) {
        const [role] = await tx
          .insert(roles)
          .values({
            tenantId: organizationId,
            name: def.name,
            slug: def.slug,
            description: def.description,
            isDefault: true,
          })
          .returning()

        if (!role) continue

        const permissionInserts = def.permissions
          .map((perm) => ({
            roleId: role.id,
            permissionId: permMap.get(perm),
          }))
          .filter((entry): entry is { roleId: string; permissionId: string } =>
            Boolean(entry.permissionId)
          )

        if (permissionInserts.length > 0) {
          await tx.insert(rolePermissions).values(permissionInserts)
        }
      }
    })
  }
}
