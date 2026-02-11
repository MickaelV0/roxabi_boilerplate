import { Inject, Injectable } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { TenantService } from '../tenant/tenant.service.js'

@Injectable()
export class PermissionService {
  constructor(
    @Inject(DRIZZLE) readonly _db: DrizzleDB,
    readonly _tenantService: TenantService
  ) {}

  /**
   * Resolve permissions for a user in an organization.
   * Used by AuthGuard and session extension.
   */
  async getPermissions(_userId: string, _organizationId: string): Promise<string[]> {
    // TODO: implement
    // 1. Look up the member's role_id from members table
    // 2. Load all permissions for that role via role_permissions join
    // 3. Return as "resource:action" string array
    // 4. If role_id is null, return empty array (treated as Viewer fallback)
    return []
  }

  /**
   * Check if a user has a specific permission in an organization.
   */
  async hasPermission(
    _userId: string,
    _organizationId: string,
    _permission: string
  ): Promise<boolean> {
    // TODO: implement
    return false
  }

  /**
   * Get all available permissions (for role management endpoints).
   */
  async getAllPermissions() {
    // TODO: implement — query the global permissions table
    return []
  }
}
