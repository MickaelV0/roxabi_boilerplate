import {
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  type NestInterceptor,
  Optional,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { from, type Observable, switchMap } from 'rxjs'
import { SKIP_ORG_KEY } from '../common/decorators/skip-org.decorator.js'
import { ErrorCode } from '../common/error-codes.js'
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

// Org-scoped routes that are allowed when org is soft-deleted
const ORG_DELETED_ALLOWED_PATTERNS = [
  { method: 'POST', pattern: /^\/api\/organizations\/[^/]+\/reactivate$/ },
  { method: 'GET', pattern: /^\/api\/organizations\/[^/]+$/ },
]

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name)

  constructor(
    private readonly cls: ClsService,
    private readonly reflector: Reflector,
    @Optional() @Inject(DRIZZLE) private readonly db: DrizzleDB | null
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipOrg = this.reflector.getAllAndOverride<boolean>(SKIP_ORG_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skipOrg) {
      return next.handle()
    }

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
    return from(this.resolveParentOrg(activeOrganizationId, request)).pipe(
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
   * Also checks if the organization is soft-deleted and blocks
   * non-allowed operations if so.
   */
  private async resolveParentOrg(orgId: string, request: AuthenticatedRequest): Promise<string> {
    if (!this.db) {
      return orgId
    }

    try {
      const orgs = await this.db
        .select({
          id: schema.organizations.id,
          name: schema.organizations.name,
          slug: schema.organizations.slug,
          logo: schema.organizations.logo,
          metadata: schema.organizations.metadata,
          deletedAt: schema.organizations.deletedAt,
          deleteScheduledFor: schema.organizations.deleteScheduledFor,
          createdAt: schema.organizations.createdAt,
          updatedAt: schema.organizations.updatedAt,
        })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, orgId))
        .limit(1)

      const org = orgs[0]

      if (!org) {
        this.logger.warn(`Organization ${orgId} not found during tenant resolution`)
        return orgId
      }

      // Check if org is soft-deleted
      if (org.deletedAt) {
        const method = request.method.toUpperCase()
        const path = request.url?.split('?')[0]

        const isAllowed = ORG_DELETED_ALLOWED_PATTERNS.some(
          (route) => route.method === method && path && route.pattern.test(path)
        )

        if (!isAllowed) {
          throw new ForbiddenException({
            message: 'Organization is scheduled for deletion',
            errorCode: ErrorCode.ORG_SCHEDULED_FOR_DELETION,
            deleteScheduledFor: org.deleteScheduledFor?.toISOString(),
          })
        }
      }

      // TODO: re-enable in Phase 3 when parent tenant resolution is designed.
      // parentOrganizationId is present in the schema but the resolution
      // strategy (which context should inherit which tenant) is not yet defined.
      // if (org.parentOrganizationId) {
      //   return org.parentOrganizationId
      // }

      return orgId
    } catch (error) {
      // Re-throw ForbiddenException (soft-delete check)
      if (error instanceof ForbiddenException) {
        throw error
      }
      // On any other DB error, fall back to using the org ID directly
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
