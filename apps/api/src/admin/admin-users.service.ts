import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { AuditService } from '../audit/audit.service.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'

/**
 * AdminUsersService — cross-tenant user management for super admins.
 *
 * Uses raw DRIZZLE connection (not TenantService) because admin operations
 * require cross-tenant access. No organizationId scoping on user queries.
 *
 * WARNING: The raw DRIZZLE connection bypasses all RLS policies.
 */
@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService,
    private readonly cls: ClsService
  ) {}

  // TODO: implement — listUsers(filters, cursor, limit)
  // Cursor-paginated user list with filters (role, status, org, search)
  // Join users + members for org names. ILIKE search with escaping

  // TODO: implement — getUserDetail(userId)
  // User profile + org memberships + last 10 audit entries

  // TODO: implement — updateUser(userId, data, actorId)
  // Update name/email/role. Read before-state, mutate, audit log

  // TODO: implement — banUser(userId, reason, expires, actorId)
  // Set banned=true, banReason, optional banExpires. Audit log

  // TODO: implement — unbanUser(userId, actorId)
  // Set banned=false, clear banReason/banExpires. Audit log

  // TODO: implement — deleteUser(userId, actorId)
  // Set deletedAt + deleteScheduledFor. Audit log

  // TODO: implement — restoreUser(userId, actorId)
  // Clear deletedAt + deleteScheduledFor. Audit log
}
