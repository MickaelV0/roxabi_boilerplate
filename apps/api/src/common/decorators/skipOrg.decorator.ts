import { SetMetadata } from '@nestjs/common'

/**
 * @SkipOrg() — Defensive documentation decorator for cross-tenant endpoints.
 *
 * Applied to controllers that use @Roles('superadmin') without @Permissions().
 * Sets metadata that the @RequireOrg guard respects, preventing future regressions
 * if the guard chain is refactored to be default-on.
 *
 * Currently, @RequireOrg and @Permissions are opt-in metadata decorators —
 * they only fire when explicitly set. @SkipOrg() is a safety net.
 */
export const SKIP_ORG_KEY = 'SKIP_ORG'
export const SkipOrg = () => SetMetadata(SKIP_ORG_KEY, true)
