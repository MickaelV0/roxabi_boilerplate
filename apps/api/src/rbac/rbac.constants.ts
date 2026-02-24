export type DefaultRoleDefinition = {
  name: string
  slug: string
  description: string
  permissions: string[]
}

export const DEFAULT_ROLES: DefaultRoleDefinition[] = [
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
      'api_keys:read',
      'api_keys:write',
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
      'api_keys:read',
      'api_keys:write',
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
    permissions: [
      'users:read',
      'organizations:read',
      'members:read',
      'invitations:read',
      'roles:read',
    ],
  },
]
