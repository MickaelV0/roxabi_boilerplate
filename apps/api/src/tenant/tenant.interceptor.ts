import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import type { Observable } from 'rxjs'

type AuthenticatedRequest = FastifyRequest & {
  session?: {
    session: { activeOrganizationId?: string | null }
  } | null
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const activeOrganizationId = request.session?.session?.activeOrganizationId ?? null

    // TODO: resolve child org → parent org tenant_id
    // If activeOrganizationId belongs to a child org, look up the parent org's ID
    // and use that as the tenantId instead. Cache the resolution per-request in CLS.
    const tenantId = activeOrganizationId

    this.cls.set('tenantId', tenantId)

    return next.handle()
  }
}
