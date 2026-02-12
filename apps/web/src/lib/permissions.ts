import type { PermissionString } from '@repo/types'

type SessionWithPermissions = {
  permissions?: string[]
}

/**
 * Check if the session has a specific permission.
 *
 * Usage:
 *   const canInvite = hasPermission(session, 'members:write')
 *
 *   if (!hasPermission(session, 'members:read')) {
 *     return <Forbidden />
 *   }
 */
export function hasPermission(
  session: SessionWithPermissions | null | undefined,
  permission: PermissionString
): boolean {
  if (!session?.permissions) return false
  return session.permissions.includes(permission)
}

/**
 * Check if the session has all of the specified permissions.
 */
export function hasAllPermissions(
  session: SessionWithPermissions | null | undefined,
  permissions: PermissionString[]
): boolean {
  return permissions.every((p) => hasPermission(session, p))
}

/**
 * Check if the session has any of the specified permissions.
 */
export function hasAnyPermission(
  session: SessionWithPermissions | null | undefined,
  permissions: PermissionString[]
): boolean {
  return permissions.some((p) => hasPermission(session, p))
}
