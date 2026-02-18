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

// Value exports inlined here to avoid Node.js ESM resolution of ./account.js
// (the types package has no build step — Node can't resolve .js → .ts)
export const DICEBEAR_CDN_BASE = 'https://api.dicebear.com/9.x'

export const AVATAR_STYLES = [
  'lorelei',
  'bottts',
  'pixel-art',
  'thumbs',
  'avataaars',
  'adventurer',
  'toon-head',
] as const

export const ERROR_CODES = {
  ACCOUNT_SCHEDULED_FOR_DELETION: 'ACCOUNT_SCHEDULED_FOR_DELETION',
  ORG_SCHEDULED_FOR_DELETION: 'ORG_SCHEDULED_FOR_DELETION',
} as const
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
