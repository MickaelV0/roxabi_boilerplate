import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Role } from '@repo/types'
import type { FastifyRequest } from 'fastify'
import { PermissionService } from '../rbac/permission.service.js'
import { AuthService } from './auth.service.js'

type AuthSession = {
  user: { id: string; role?: Role }
  session: { id: string; activeOrganizationId?: string | null }
}

function isAuthSession(value: unknown): value is AuthSession {
  if (value === null || value === undefined) return false
  const v = value as Record<string, unknown>
  if (typeof v.user !== 'object' || v.user === null) return false
  if (typeof v.session !== 'object' || v.session === null) return false
  const user = v.user as Record<string, unknown>
  const session = v.session as Record<string, unknown>
  return typeof user.id === 'string' && typeof session.id === 'string'
}

type AuthenticatedRequest = FastifyRequest & {
  session: AuthSession | null
  user: AuthSession['user'] | null
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => PermissionService))
    private readonly permissionService: PermissionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const raw = await this.authService.getSession(request)
    const session = isAuthSession(raw) ? raw : null

    request.session = session
    request.user = session?.user ?? null

    const isOptional = this.reflector.getAllAndOverride<boolean>('OPTIONAL_AUTH', [
      context.getHandler(),
      context.getClass(),
    ])
    if (!session && isOptional) return true
    if (!session) throw new UnauthorizedException()

    this.checkRoles(context, session)
    this.checkOrgRequired(context, session)
    await this.checkPermissions(context, session)

    return true
  }

  private checkRoles(context: ExecutionContext, session: AuthSession) {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('ROLES', [
      context.getHandler(),
      context.getClass(),
    ])
    if (requiredRoles?.length) {
      const userRole = session.user.role ?? 'user'
      if (!requiredRoles.includes(userRole)) throw new ForbiddenException()
    }
  }

  private checkOrgRequired(context: ExecutionContext, session: AuthSession) {
    const requireOrg = this.reflector.getAllAndOverride<boolean>('REQUIRE_ORG', [
      context.getHandler(),
      context.getClass(),
    ])
    if (requireOrg && !session.session.activeOrganizationId) {
      throw new ForbiddenException('No active organization')
    }
  }

  private async checkPermissions(context: ExecutionContext, session: AuthSession) {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('PERMISSIONS', [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredPermissions?.length) return

    const orgId = session.session.activeOrganizationId
    if (!orgId) {
      throw new ForbiddenException('No active organization')
    }

    if (session.user.role === 'superadmin') return

    const userPermissions = await this.permissionService.getPermissions(session.user.id, orgId)
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p))
    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions')
    }
  }
}
