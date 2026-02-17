import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../common/error-codes.js'
import { AuthGuard } from './auth.guard.js'

function createMockAuthService(session: Record<string, unknown> | null = null) {
  return {
    getSession: vi.fn().mockResolvedValue(session),
  }
}

function createMockReflector(metadata: Record<string, unknown> = {}) {
  return {
    getAllAndOverride: vi.fn().mockImplementation((key: string) => metadata[key]),
  }
}

function createMockContext(request: Record<string, unknown> = {}) {
  const req = { method: 'GET', url: '/api/some/endpoint', ...request }

  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  }

  return { context, req }
}

function createMockUserService(
  deletedAt: Date | null = null,
  deleteScheduledFor: Date | null = null
) {
  return {
    getSoftDeleteStatus: vi.fn().mockResolvedValue({ deletedAt, deleteScheduledFor }),
  }
}

function createGuard(
  session: Record<string, unknown> | null = null,
  metadata: Record<string, unknown> = {},
  userService: Record<string, unknown> = createMockUserService()
) {
  const authService = createMockAuthService(session)
  const reflector = createMockReflector(metadata)
  const guard = new AuthGuard(authService as never, reflector as never, userService as never)

  return { guard, authService, reflector }
}

describe('AuthGuard', () => {
  it('should return true when route is public', async () => {
    const { guard } = createGuard(null, { PUBLIC: true })
    const { context } = createMockContext()

    const result = await guard.canActivate(context as never)

    expect(result).toBe(true)
  })

  it('should return true when auth is optional and no session exists', async () => {
    const { guard } = createGuard(null, { OPTIONAL_AUTH: true })
    const { context } = createMockContext()

    const result = await guard.canActivate(context as never)

    expect(result).toBe(true)
  })

  it('should throw UnauthorizedException when no session on protected route', async () => {
    const { guard } = createGuard(null)
    const { context } = createMockContext()

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException)
  })

  it('should set request.session and request.user when session is valid', async () => {
    const session = {
      user: { id: 'user-1', name: 'Test', role: 'user' },
      session: { id: 'sess-1', activeOrganizationId: null },
      permissions: [],
    }
    const { guard } = createGuard(session)
    const { context, req } = createMockContext()

    const result = await guard.canActivate(context as never)

    expect(result).toBe(true)
    expect((req as Record<string, unknown>).session).toBe(session)
    expect((req as Record<string, unknown>).user).toBe(session.user)
  })

  it('should throw UnauthorizedException when session has no user', async () => {
    const session = {
      session: { id: 'sess-1', activeOrganizationId: null },
    }
    const { guard } = createGuard(session)
    const { context } = createMockContext()

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException)
  })

  it('should throw ForbiddenException when role does not match', async () => {
    const session = {
      user: { id: 'user-1', role: 'user' },
      session: { id: 'sess-1', activeOrganizationId: null },
      permissions: [],
    }
    const { guard } = createGuard(session, { ROLES: ['admin'] })
    const { context } = createMockContext()

    await expect(guard.canActivate(context as never)).rejects.toThrow(ForbiddenException)
  })

  it('should return true when role matches required roles', async () => {
    const session = {
      user: { id: 'user-1', role: 'admin' },
      session: { id: 'sess-1', activeOrganizationId: null },
      permissions: [],
    }
    const { guard } = createGuard(session, { ROLES: ['admin', 'superadmin'] })
    const { context } = createMockContext()

    const result = await guard.canActivate(context as never)

    expect(result).toBe(true)
  })

  it('should default to user role when user has no role property', async () => {
    const session = {
      user: { id: 'user-1' },
      session: { id: 'sess-1', activeOrganizationId: null },
      permissions: [],
    }
    const { guard } = createGuard(session, { ROLES: ['user'] })
    const { context } = createMockContext()

    const result = await guard.canActivate(context as never)

    expect(result).toBe(true)
  })

  it('should throw ForbiddenException with message when REQUIRE_ORG is set and no activeOrganizationId', async () => {
    const session = {
      user: { id: 'user-1', role: 'user' },
      session: { id: 'sess-1', activeOrganizationId: null },
      permissions: [],
    }
    const { guard } = createGuard(session, { REQUIRE_ORG: true })
    const { context } = createMockContext()

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      new ForbiddenException('No active organization')
    )
  })

  it('should return true when REQUIRE_ORG is set and activeOrganizationId exists', async () => {
    const session = {
      user: { id: 'user-1', role: 'user' },
      session: { id: 'sess-1', activeOrganizationId: 'org-1' },
      permissions: [],
    }
    const { guard } = createGuard(session, { REQUIRE_ORG: true })
    const { context } = createMockContext()

    const result = await guard.canActivate(context as never)

    expect(result).toBe(true)
  })

  describe('PERMISSIONS check', () => {
    it('should throw ForbiddenException when no active org and permissions required', async () => {
      const session = {
        user: { id: 'user-1', role: 'user' },
        session: { id: 'sess-1', activeOrganizationId: null },
        permissions: [],
      }
      const { guard } = createGuard(session, { PERMISSIONS: ['roles:read'] })
      const { context } = createMockContext()

      await expect(guard.canActivate(context as never)).rejects.toThrow(ForbiddenException)
    })

    it('should bypass permission check for superadmin', async () => {
      const session = {
        user: { id: 'user-1', role: 'superadmin' },
        session: { id: 'sess-1', activeOrganizationId: 'org-1' },
        permissions: [],
      }
      const { guard } = createGuard(session, {
        PERMISSIONS: ['roles:read'],
      })
      const { context } = createMockContext()

      const result = await guard.canActivate(context as never)

      expect(result).toBe(true)
    })

    it('should allow when user has required permissions', async () => {
      const session = {
        user: { id: 'user-1', role: 'user' },
        session: { id: 'sess-1', activeOrganizationId: 'org-1' },
        permissions: ['roles:read', 'members:read'],
      }
      const { guard } = createGuard(session, { PERMISSIONS: ['roles:read'] })
      const { context } = createMockContext()

      const result = await guard.canActivate(context as never)

      expect(result).toBe(true)
    })

    it('should throw ForbiddenException when user lacks required permissions', async () => {
      const session = {
        user: { id: 'user-1', role: 'user' },
        session: { id: 'sess-1', activeOrganizationId: 'org-1' },
        permissions: ['roles:read'],
      }
      const { guard } = createGuard(session, { PERMISSIONS: ['roles:write'] })
      const { context } = createMockContext()

      await expect(guard.canActivate(context as never)).rejects.toThrow(
        new ForbiddenException('Insufficient permissions')
      )
    })

    it('should require all permissions when multiple are specified', async () => {
      const session = {
        user: { id: 'user-1', role: 'user' },
        session: { id: 'sess-1', activeOrganizationId: 'org-1' },
        permissions: ['roles:read'],
      }
      const { guard } = createGuard(session, { PERMISSIONS: ['roles:read', 'members:write'] })
      const { context } = createMockContext()

      await expect(guard.canActivate(context as never)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('checkSoftDeleted', () => {
    const validSession = {
      user: { id: 'user-1', role: 'user' },
      session: { id: 'sess-1', activeOrganizationId: null },
      permissions: [],
    }

    it('should allow active user (no deletedAt) to pass through', async () => {
      // Arrange
      const userService = createMockUserService(null, null)
      const { guard } = createGuard(validSession, {}, userService)
      const { context } = createMockContext({ method: 'GET', url: '/api/users/settings' })

      // Act
      const result = await guard.canActivate(context as never)

      // Assert
      expect(result).toBe(true)
    })

    it('should block soft-deleted user on normal endpoints', async () => {
      // Arrange
      const deleteDate = new Date('2026-03-01T00:00:00.000Z')
      const userService = createMockUserService(new Date(), deleteDate)
      const { guard } = createGuard(validSession, {}, userService)
      const { context } = createMockContext({ method: 'GET', url: '/api/users/settings' })

      // Act & Assert
      await expect(guard.canActivate(context as never)).rejects.toThrow(ForbiddenException)
    })

    it('should allow soft-deleted user to access POST /api/users/me/reactivate', async () => {
      // Arrange
      const userService = createMockUserService(new Date(), new Date('2026-03-01'))
      const { guard } = createGuard(validSession, {}, userService)
      const { context } = createMockContext({ method: 'POST', url: '/api/users/me/reactivate' })

      // Act
      const result = await guard.canActivate(context as never)

      // Assert
      expect(result).toBe(true)
    })

    it('should allow soft-deleted user to access GET /api/users/me', async () => {
      // Arrange
      const userService = createMockUserService(new Date(), new Date('2026-03-01'))
      const { guard } = createGuard(validSession, {}, userService)
      const { context } = createMockContext({ method: 'GET', url: '/api/users/me' })

      // Act
      const result = await guard.canActivate(context as never)

      // Assert
      expect(result).toBe(true)
    })

    it('should block soft-deleted user on non-POST to /api/users/me/reactivate', async () => {
      // Arrange
      const deleteDate = new Date('2026-03-01T00:00:00.000Z')
      const userService = createMockUserService(new Date(), deleteDate)
      const { guard } = createGuard(validSession, {}, userService)
      const { context } = createMockContext({ method: 'GET', url: '/api/users/me/reactivate' })

      // Act & Assert
      await expect(guard.canActivate(context as never)).rejects.toThrow(ForbiddenException)
    })

    it('should include deleteScheduledFor in error response', async () => {
      // Arrange
      const deleteDate = new Date('2026-03-01T00:00:00.000Z')
      const userService = createMockUserService(new Date(), deleteDate)
      const { guard } = createGuard(validSession, {}, userService)
      const { context } = createMockContext({ method: 'PATCH', url: '/api/users/me/profile' })

      // Act & Assert
      try {
        await guard.canActivate(context as never)
        expect.unreachable('Should have thrown ForbiddenException')
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException)
        const response = (error as ForbiddenException).getResponse() as Record<string, unknown>
        expect(response.message).toBe('Account is scheduled for deletion')
        expect(response.errorCode).toBe(ErrorCode.ACCOUNT_SCHEDULED_FOR_DELETION)
        expect(response.deleteScheduledFor).toBe('2026-03-01T00:00:00.000Z')
      }
    })

    it('should strip query string before matching allowed routes', async () => {
      // Arrange
      const userService = createMockUserService(new Date(), new Date('2026-03-01'))
      const { guard } = createGuard(validSession, {}, userService)
      const { context } = createMockContext({
        method: 'POST',
        url: '/api/users/me/reactivate?token=abc',
      })

      // Act
      const result = await guard.canActivate(context as never)

      // Assert
      expect(result).toBe(true)
    })
  })
})
