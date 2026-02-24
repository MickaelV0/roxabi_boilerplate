/** Org member as returned by the admin members API */
export type Member = {
  id: string
  userId: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/** Pagination metadata returned alongside paginated API responses */
export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Response shape for the admin members list endpoint */
export type MembersResponse = {
  data: Member[]
  pagination: PaginationMeta
}

// --- Phase 2: Cross-tenant types ---

/** Admin user as returned by the cross-tenant users API */
export type AdminUser = {
  id: string
  name: string
  email: string
  role: string | null
  banned: boolean | null
  banReason: string | null
  banExpires: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  organizations: { id: string; name: string; slug: string | null; role: string }[]
}

/** Extended user detail with activity summary */
export type AdminUserDetail = AdminUser & {
  image: string | null
  lastActive: string | null
  activitySummary: import('./audit').AuditLogEntry[]
}

/** Filter parameters for the admin users list */
export type UserFilters = {
  role?: string
  status?: string
  organizationId?: string
  search?: string
}

/** Admin organization as returned by the cross-tenant organizations API */
export type AdminOrganization = {
  id: string
  name: string
  slug: string | null
  parentOrganizationId: string | null
  memberCount: number
  childCount: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Extended organization detail with members and children */
export type AdminOrgDetail = AdminOrganization & {
  parentOrganization: { id: string; name: string; slug: string | null } | null
  members: { id: string; name: string; email: string; role: string; createdAt: string }[]
  children: { id: string; name: string; slug: string | null; memberCount: number }[]
}

/** Filter parameters for the admin organizations list */
export type OrgFilters = {
  status?: string
  search?: string
  view?: 'list' | 'tree'
}

/** Filter parameters for the admin audit log list */
export type AuditLogFilters = {
  from?: string
  to?: string
  actorId?: string
  action?: string
  resource?: string
  organizationId?: string
  search?: string
}

/** Impact preview for organization deletion */
export type OrgDeletionImpact = {
  memberCount: number
  activeMembers: number
  childOrgCount: number
  childMemberCount: number
}
