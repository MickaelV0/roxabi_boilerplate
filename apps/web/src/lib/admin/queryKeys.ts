export const adminOrgKeys = {
  all: ['admin', 'organizations'] as const,
  list: (filters: unknown) => [...adminOrgKeys.all, 'list', filters] as const,
  tree: () => [...adminOrgKeys.all, 'tree'] as const,
  allForParent: () => [...adminOrgKeys.all, 'all-for-parent'] as const,
  filterOptions: () => [...adminOrgKeys.all, 'filter-options'] as const,
  detail: (orgId: string) => [...adminOrgKeys.all, orgId] as const,
  roles: (orgId: string) => [...adminOrgKeys.all, orgId, 'roles'] as const,
  deletionImpact: (orgId: string) => [...adminOrgKeys.all, orgId, 'deletion-impact'] as const,
} as const

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  list: (filters: unknown) => [...adminUserKeys.all, filters] as const,
  detail: (userId: string) => [...adminUserKeys.all, userId] as const,
} as const

export const adminAuditKeys = {
  all: ['admin', 'audit-logs'] as const,
  list: (filters: unknown) => [...adminAuditKeys.all, filters] as const,
} as const

export const adminSettingsKeys = {
  all: ['admin', 'system-settings'] as const,
} as const
