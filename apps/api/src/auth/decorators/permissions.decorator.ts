import { SetMetadata } from '@nestjs/common'
import type { PermissionString } from '@repo/types'

/**
 * Require specific permissions on a controller method.
 * Implies `@RequireOrg()` — guard will require active organization context.
 *
 * Usage:
 *   @Permissions('members:write')
 *   @Permissions('members:write', 'invitations:write')  // all required
 */
export const Permissions = (...permissions: PermissionString[]) =>
  SetMetadata('PERMISSIONS', permissions)
