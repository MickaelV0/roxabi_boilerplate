export type User = {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image: string | null
  role: Role | null
  banned: boolean | null
  banReason: string | null
  createdAt: Date
  updatedAt: Date
}

export type Role = 'user' | 'admin' | 'superadmin'

export type ApiErrorResponse = {
  statusCode: number
  timestamp: string
  path: string
  correlationId: string
  message: string | string[]
  errorCode?: string
}

export type {
  DefaultRoleSlug,
  OrgRole,
  Permission,
  PermissionAction,
  PermissionResource,
  PermissionString,
  RolePermission,
} from './rbac.js'
