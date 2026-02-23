import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'

/** Sensitive fields that must be redacted in audit log before/after data */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'accessToken',
  'refreshToken',
  'idToken',
] as const

/**
 * AdminAuditLogsService — audit log query and redaction for super admins.
 *
 * Uses raw DRIZZLE connection for cross-tenant access.
 */
@Injectable()
export class AdminAuditLogsService {
  private readonly logger = new Logger(AdminAuditLogsService.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly cls: ClsService
  ) {}

  // TODO: implement — listAuditLogs(filters, cursor, limit)
  // Cursor-paginated audit entries with filters (date range, actor, action, resource, org, search)
  // Join actor name. Apply redaction to before/after JSONB before response

  // TODO: implement — redactSensitiveFields(data)
  // Replace sensitive key values with '[REDACTED]' (case-insensitive match)
}
