// ---------------------------------------------------------------------------
// Auth / User
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export type ApiErrorResponse = {
  statusCode: number
  timestamp: string
  path: string
  correlationId: string
  message: string | string[]
  errorCode?: string
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

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

export type AvatarStyle = (typeof AVATAR_STYLES)[number]

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export type UserProfile = {
  id: string
  firstName: string
  lastName: string
  /**
   * Mapped from the DB column `name` (Better Auth convention).
   * The API exposes it as `fullName` for clarity; the `User` type from Better Auth uses `name` directly.
   */
  fullName: string
  fullNameCustomized: boolean
  email: string
  emailVerified: boolean
  image: string | null
  avatarSeed: string | null
  avatarStyle: AvatarStyle | null
  avatarOptions: Record<string, unknown>
  role: string | null
  createdAt: Date
  updatedAt: Date
}

export type UpdateProfilePayload = {
  firstName?: string
  lastName?: string
  fullName?: string
  avatarSeed?: string
  avatarStyle?: AvatarStyle
  avatarOptions?: Record<string, unknown>
  image?: string
}

// ---------------------------------------------------------------------------
// Account Deletion
// ---------------------------------------------------------------------------

export type OrgOwnershipResolution =
  | { organizationId: string; action: 'transfer'; transferToUserId: string }
  | { organizationId: string; action: 'delete' }

export type DeleteAccountPayload = {
  confirmEmail: string
  orgResolutions: OrgOwnershipResolution[]
}

export type AccountDeletionStatus = {
  deletedAt: string
  deleteScheduledFor: string
}

// ---------------------------------------------------------------------------
// Organization Deletion
// ---------------------------------------------------------------------------

export type DeletionImpact = {
  memberCount: number
  invitationCount: number
  customRoleCount: number
}

export type DeleteOrgPayload = {
  confirmName: string
}

// ---------------------------------------------------------------------------
// Error Codes
// ---------------------------------------------------------------------------

export const ERROR_CODES = {
  ACCOUNT_SCHEDULED_FOR_DELETION: 'ACCOUNT_SCHEDULED_FOR_DELETION',
  ORG_SCHEDULED_FOR_DELETION: 'ORG_SCHEDULED_FOR_DELETION',
} as const

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export interface ConsentCategories {
  necessary: true
  analytics: boolean
  marketing: boolean
}

export type ConsentAction = 'accepted' | 'rejected' | 'customized'

export interface ConsentCookiePayload {
  categories: ConsentCategories
  consentedAt: string | null
  policyVersion: string | null
  action: ConsentAction | null
}

export interface ConsentState extends ConsentCookiePayload {
  showBanner: boolean
}

export interface ConsentActions {
  acceptAll: () => void
  rejectAll: () => void
  saveCustom: (categories: ConsentCategories) => void
  openSettings: () => void
}

export interface ConsentRecord {
  id: string
  userId: string
  categories: ConsentCategories
  policyVersion: string
  action: ConsentAction
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

/** Resource types that can have permissions */
export type PermissionResource = 'users' | 'organizations' | 'members' | 'invitations' | 'roles'

/** Actions that can be performed on resources */
export type PermissionAction = 'read' | 'write' | 'delete'

/** Permission string format: `resource:action` */
export type PermissionString = `${PermissionResource}:${PermissionAction}`

/** Default role slugs seeded per organization */
export type DefaultRoleSlug = 'owner' | 'admin' | 'member' | 'viewer'

export type Permission = {
  id: string
  resource: PermissionResource
  action: PermissionAction
  description: string
  createdAt: Date
}

export type OrgRole = {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export type RolePermission = {
  roleId: string
  permissionId: string
}
