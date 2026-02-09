import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { FastifyRequest } from 'fastify'
import { AuthService } from './auth.service.js'

type AuthSession = {
  user: { id: string; role?: string }
  session: { id: string; activeOrganizationId?: string | null }
}

type AuthenticatedRequest = FastifyRequest & {
  session: AuthSession | null
  user: AuthSession['user'] | null
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const session = (await this.authService.getSession(request)) as AuthSession | null

    request.session = session
    request.user = session?.user ?? null

    const isOptional = this.reflector.getAllAndOverride<boolean>('OPTIONAL_AUTH', [
      context.getHandler(),
      context.getClass(),
    ])
    if (!session && isOptional) return true
    if (!session) throw new UnauthorizedException()

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('ROLES', [
      context.getHandler(),
      context.getClass(),
    ])
    if (requiredRoles?.length) {
      const userRole = session.user.role ?? 'user'
      if (!requiredRoles.includes(userRole)) throw new ForbiddenException()
    }

    const requireOrg = this.reflector.getAllAndOverride<boolean>('REQUIRE_ORG', [
      context.getHandler(),
      context.getClass(),
    ])
    if (requireOrg && !session.session.activeOrganizationId) {
      throw new ForbiddenException('No active organization')
    }

    return true
  }
}
