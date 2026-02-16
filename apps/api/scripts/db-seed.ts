/**
 * Seed script — inserts dev essentials into a fresh database.
 *
 * Designed for fresh databases only (not idempotent).
 * For re-seeding, drop and recreate the database (db:branch:create --force).
 *
 * Seeds:
 *   1. User: dev@roxabi.local / password123
 *   2. Account: credential provider with hashed password
 *   3. Organization: "Roxabi Dev" (slug: roxabi-dev)
 *   4. Member: user → org (role: owner)
 *   5. Permissions: 15 resource:action pairs (idempotent via ON CONFLICT)
 *   6. RBAC: 4 default roles (Owner, Admin, Member, Viewer) with permissions
 *   7. Update member.roleId to Owner role
 *
 * Usage:
 *   DATABASE_URL=postgresql://... tsx scripts/db-seed.ts
 *   bun run db:seed  (reads DATABASE_URL from .env)
 */

import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/database/schema/index.js'
import { DEFAULT_ROLES } from '../src/rbac/rbac.constants.js'

const DEFAULT_PERMISSIONS = [
  { resource: 'users', action: 'read', description: 'View user profiles' },
  { resource: 'users', action: 'write', description: 'Edit user profiles' },
  { resource: 'users', action: 'delete', description: 'Delete users' },
  { resource: 'organizations', action: 'read', description: 'View organization details' },
  { resource: 'organizations', action: 'write', description: 'Edit organization settings' },
  { resource: 'organizations', action: 'delete', description: 'Delete organization' },
  { resource: 'members', action: 'read', description: 'View organization members' },
  { resource: 'members', action: 'write', description: 'Manage members and roles' },
  { resource: 'members', action: 'delete', description: 'Remove members from organization' },
  { resource: 'invitations', action: 'read', description: 'View pending invitations' },
  { resource: 'invitations', action: 'write', description: 'Send invitations' },
  { resource: 'invitations', action: 'delete', description: 'Revoke invitations' },
  { resource: 'roles', action: 'read', description: 'View roles and permissions' },
  { resource: 'roles', action: 'write', description: 'Create and edit roles' },
  { resource: 'roles', action: 'delete', description: 'Delete custom roles' },
] as const

type DbInstance = PostgresJsDatabase<typeof schema>
type Tx = Parameters<Parameters<DbInstance['transaction']>[0]>[0]

/** Insert the 15 global permissions (idempotent — uses ON CONFLICT DO NOTHING). */
async function seedPermissions(tx: Tx): Promise<number> {
  const result = await tx
    .insert(schema.permissions)
    .values(DEFAULT_PERMISSIONS.map((p) => ({ ...p })))
    .onConflictDoNothing({ target: [schema.permissions.resource, schema.permissions.action] })
  return result.length
}

/** Build a map of "resource:action" → permission ID from pre-seeded permissions. */
async function buildPermissionMap(tx: Tx): Promise<Map<string, string>> {
  const allPerms = await tx.select().from(schema.permissions)
  return new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]))
}

/** Seed RBAC roles and their permission assignments for an organization. */
async function seedRbac(
  tx: Tx,
  orgId: string,
  permMap: Map<string, string>
): Promise<{ ownerRoleId: string | null; totalRolePermissions: number }> {
  let totalRolePermissions = 0
  let ownerRoleId: string | null = null

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

    if (roleDef.slug === 'owner') {
      ownerRoleId = roleId
    }

    const rolePermValues: { roleId: string; permissionId: string }[] = []
    for (const permKey of roleDef.permissions) {
      const permissionId = permMap.get(permKey)
      if (!permissionId) {
        console.warn(`db-seed: permission "${permKey}" not found in permissions table — skipping`)
        continue
      }
      rolePermValues.push({ roleId, permissionId })
    }

    if (rolePermValues.length > 0) {
      await tx.insert(schema.rolePermissions).values(rolePermValues)
      totalRolePermissions += rolePermValues.length
    }
  }

  return { ownerRoleId, totalRolePermissions }
}

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('db-seed: DATABASE_URL environment variable is required')
    process.exit(1)
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('db-seed: refusing to run in production (NODE_ENV=production)')
    process.exit(1)
  }

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client, { schema })

  try {
    await db.transaction(async (tx) => {
      // 1. Create user
      const userId = crypto.randomUUID()
      await tx.insert(schema.users).values({
        id: userId,
        name: 'Dev User',
        email: 'dev@roxabi.local',
        emailVerified: true,
      })

      // 2. Hash password and create account
      const hashedPassword = await hashPassword('password123')
      await tx.insert(schema.accounts).values({
        id: crypto.randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: hashedPassword,
      })

      // 3. Create organization
      const orgId = crypto.randomUUID()
      await tx.insert(schema.organizations).values({
        id: orgId,
        name: 'Roxabi Dev',
        slug: 'roxabi-dev',
      })

      // 4. Create member (roleId updated after RBAC seeding)
      const memberId = crypto.randomUUID()
      await tx.insert(schema.members).values({
        id: memberId,
        userId,
        organizationId: orgId,
        role: 'owner',
        roleId: null,
      })

      // 5. Seed global permissions (idempotent — safe after db:reset)
      const permCount = await seedPermissions(tx)

      // 6. Seed RBAC roles and permissions
      const permMap = await buildPermissionMap(tx)
      if (permMap.size === 0) {
        console.warn(
          'db-seed: no permissions found after seeding — role-permission assignments will be skipped'
        )
      }
      const { ownerRoleId, totalRolePermissions } = await seedRbac(tx, orgId, permMap)

      // 7. Update member.roleId to Owner role
      if (ownerRoleId) {
        await tx
          .update(schema.members)
          .set({ roleId: ownerRoleId })
          .where(eq(schema.members.id, memberId))
      }

      console.log(
        `Seeded: 1 user, 1 org, 1 member, ${permCount} permissions, ${DEFAULT_ROLES.length} roles, ${totalRolePermissions} role_permissions`
      )
    })
  } catch (error) {
    console.error('db-seed: failed to seed database:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
