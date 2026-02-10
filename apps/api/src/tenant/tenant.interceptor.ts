import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
  type NestInterceptor,
  Optional,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { from, type Observable, switchMap } from 'rxjs'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import * as schema from '../database/schema/index.js'

type AuthenticatedRequest = FastifyRequest & {
  session?: {
    session: { activeOrganizationId?: string | null }
  } | null
}

/**
 * CLS key used to cache the resolved org ID -> tenant ID mapping
 * within a single request. Prevents repeated DB lookups when the
 * interceptor runs for the same activeOrganizationId.
 */
const CLS_RESOLVED_TENANT_KEY = 'resolvedTenantMap'

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name)

  constructor(
    private readonly cls: ClsService,
    @Optional() @Inject(DRIZZLE) private readonly db: DrizzleDB | null
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const activeOrganizationId = request.session?.session?.activeOrganizationId ?? null

    if (!activeOrganizationId) {
      this.cls.set('tenantId', null)
      return next.handle()
    }

    // Fast path: if we already resolved this org ID in this request, reuse it
    const cached = this.getCachedTenantId(activeOrganizationId)
    if (cached !== undefined) {
      this.cls.set('tenantId', cached)
      return next.handle()
    }

    // If no DB is available, fall back to using activeOrganizationId directly
    if (!this.db) {
      this.cls.set('tenantId', activeOrganizationId)
      return next.handle()
    }

    // Resolve child org -> parent org asynchronously
    return from(this.resolveParentOrg(activeOrganizationId)).pipe(
      switchMap((tenantId) => {
        this.cls.set('tenantId', tenantId)
        this.setCachedTenantId(activeOrganizationId, tenantId)
        return next.handle()
      })
    )
  }

  /**
   * Resolves the tenant ID for a given organization.
   *
   * If the organization has a parent (i.e. it is a child org), the parent's
   * ID is returned because child orgs share the parent's tenant boundary.
   * If the organization has no parent or is not found, the org's own ID is returned.
   *
   * NOTE: The Better Auth organizations schema does not currently include a
   * `parent_organization_id` column. Once that column is added to the schema
   * (via migration or Better Auth plugin configuration), child org resolution
   * will work automatically. Until then, every org is treated as a root org.
   */
  private async resolveParentOrg(orgId: string): Promise<string> {
    if (!this.db) {
      return orgId
    }

    try {
      const orgs = await this.db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, orgId))
        .limit(1)

      const org = orgs[0]

      if (!org) {
        // Organization not found in DB — don't block the request, just use the ID as-is
        this.logger.warn(`Organization ${orgId} not found during tenant resolution`)
        return orgId
      }

      // Check if the organizations table has a parent column.
      // Better Auth may not include this column by default.
      // When a `parentOrganizationId` field exists on the row, use it to resolve
      // the parent tenant boundary.
      const parentId = (org as Record<string, unknown>).parentOrganizationId as
        | string
        | null
        | undefined
      if (parentId) {
        return parentId
      }

      return orgId
    } catch (error) {
      // On any DB error, fall back to using the org ID directly
      // rather than blocking the request
      this.logger.error(`Failed to resolve parent org for ${orgId}`, error)
      return orgId
    }
  }

  private getCachedTenantId(orgId: string): string | undefined {
    const map = this.cls.get(CLS_RESOLVED_TENANT_KEY) as Map<string, string> | undefined
    return map?.get(orgId)
  }

  private setCachedTenantId(orgId: string, tenantId: string): void {
    let map = this.cls.get(CLS_RESOLVED_TENANT_KEY) as Map<string, string> | undefined
    if (!map) {
      map = new Map()
      this.cls.set(CLS_RESOLVED_TENANT_KEY, map)
    }
    map.set(orgId, tenantId)
  }
}
