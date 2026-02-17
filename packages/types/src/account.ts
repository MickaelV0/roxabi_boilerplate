/**
 * Account & organization management types.
 * Shared between frontend and backend for #201/#202.
 */

// -- User profile types --

export type AvatarStyle = 'lorelei' | 'bottts' | 'pixel-art' | 'thumbs' | 'avataaars'

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
}

// -- Account deletion types --

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

// -- Organization deletion types --

export type DeletionImpact = {
  memberCount: number
  invitationCount: number
  customRoleCount: number
}

export type DeleteOrgPayload = {
  confirmName: string
}

// -- Error codes --

export const ERROR_CODES = {
  ACCOUNT_SCHEDULED_FOR_DELETION: 'ACCOUNT_SCHEDULED_FOR_DELETION',
  ORG_SCHEDULED_FOR_DELETION: 'ORG_SCHEDULED_FOR_DELETION',
} as const
