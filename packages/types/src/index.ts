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
  AccountDeletionStatus,
  AvatarStyle,
  DeleteAccountPayload,
  DeleteOrgPayload,
  DeletionImpact,
  OrgOwnershipResolution,
  UpdateProfilePayload,
  UserProfile,
} from './account.js'
export { AVATAR_STYLES, DICEBEAR_CDN_BASE, ERROR_CODES } from './account.js'
export * from './consent.js'
export type {
  DefaultRoleSlug,
  OrgRole,
  Permission,
  PermissionAction,
  PermissionResource,
  PermissionString,
  RolePermission,
} from './rbac.js'
