import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { FastifyRequest } from 'fastify'
import type { AuthService } from './auth.service.js'

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

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const session = await this.authService.getSession(request)

    ;(request as unknown as Record<string, unknown>).session = session
    ;(request as unknown as Record<string, unknown>).user = session?.user ?? null

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
      const userRole = (session.user as Record<string, unknown>).role ?? 'user'
      if (!requiredRoles.includes(userRole as string)) throw new ForbiddenException()
    }

    const requireOrg = this.reflector.getAllAndOverride<boolean>('REQUIRE_ORG', [
      context.getHandler(),
      context.getClass(),
    ])
    if (requireOrg && !(session.session as Record<string, unknown>).activeOrganizationId) {
      throw new ForbiddenException('No active organization')
    }

    return true
  }
}
