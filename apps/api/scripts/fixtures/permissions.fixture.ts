import * as schema from '../../src/database/schema/index.js'
import type { FixtureContext, Preset, Tx } from './types.js'

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

/** Insert the 15 global permissions (idempotent — uses ON CONFLICT DO NOTHING). */
export async function seed(tx: Tx, _preset: Preset, _ctx: FixtureContext): Promise<number> {
  const result = await tx
    .insert(schema.permissions)
    .values(DEFAULT_PERMISSIONS.map((p) => ({ ...p })))
    .onConflictDoNothing({ target: [schema.permissions.resource, schema.permissions.action] })
  return result.length
}
