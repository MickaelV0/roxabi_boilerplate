import { Inject, Injectable } from '@nestjs/common'
import type { AuditAction, AuditActorType } from '@repo/types'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { auditLogs } from '../database/schema/audit.schema.js'

@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async log(entry: {
    actorId: string
    actorType: AuditActorType
    impersonatorId?: string
    organizationId?: string
    action: AuditAction
    resource: string
    resourceId: string
    before?: Record<string, unknown> | null
    after?: Record<string, unknown> | null
    metadata?: Record<string, unknown> | null
  }): Promise<void> {
    await this.db.insert(auditLogs).values({
      actorId: entry.actorId,
      actorType: entry.actorType,
      impersonatorId: entry.impersonatorId ?? null,
      organizationId: entry.organizationId ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      before: entry.before ?? null,
      after: entry.after ?? null,
      metadata: entry.metadata ?? null,
    })
  }
}
