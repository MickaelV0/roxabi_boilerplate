import { ThrottlerException } from '@nestjs/throttler'
import { describe, expect, it, vi } from 'vitest'

import { AUTH_SENSITIVE_PATHS, CustomThrottlerGuard } from './custom-throttler.guard.js'

/**
 * Factory: creates a CustomThrottlerGuard with mocked dependencies.
 *
 * ThrottlerGuard requires `options`, `storageService`, and `reflector` injected by NestJS.
 * We set them directly on the prototype to avoid Test.createTestingModule overhead.
 */
function createGuard(overrides: { rateLimitEnabled?: string } = {}) {
  const guard = Object.create(CustomThrottlerGuard.prototype) as CustomThrottlerGuard

  // Mock ConfigService via @Inject
  const configService = {
    get: vi.fn((key: string, defaultValue?: string) => {
      if (key === 'RATE_LIMIT_ENABLED') return overrides.rateLimitEnabled ?? 'true'
      return defaultValue
    }),
  }
  Object.defineProperty(guard, 'configService', { value: configService, writable: true })

  // Mock storageService (used by handleRequest)
  const storageService = {
    increment: vi.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60_000,
      isBlocked: false,
      timeToBlockExpire: 0,
    }),
  }
  Object.defineProperty(guard, 'storageService', { value: storageService, writable: true })

  return { guard, configService, storageService }
}

function createMockContext(
  overrides: { url?: string; ip?: string; user?: { id: string } | null } = {}
) {
  const req: Record<string, unknown> = {
    url: overrides.url ?? '/api/test',
    ip: overrides.ip ?? '127.0.0.1',
  }
  if (overrides.user !== undefined && overrides.user !== null) {
    req.user = overrides.user
  }

  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({ header: vi.fn() }),
    }),
  }

  return { context, req }
}

describe('CustomThrottlerGuard', () => {
  describe('getTracker', () => {
    it('should return user-based tracker for authenticated requests', async () => {
      // Arrange
      const { guard } = createGuard()
      const req = { user: { id: 'user-42' }, ip: '10.0.0.1' }

      // Act
      // Access protected method via bracket notation
      const tracker = await (guard as any).getTracker(req)

      // Assert
      expect(tracker).toBe('user:user-42')
    })

    it('should return IP-based tracker for anonymous requests', async () => {
      // Arrange
      const { guard } = createGuard()
      const req = { ip: '192.168.1.100' }

      // Act
      const tracker = await (guard as any).getTracker(req)

      // Assert
      expect(tracker).toBe('ip:192.168.1.100')
    })

    it('should return IP-based tracker when user has no id', async () => {
      // Arrange
      const { guard } = createGuard()
      const req = { user: {}, ip: '10.0.0.5' }

      // Act
      const tracker = await (guard as any).getTracker(req)

      // Assert
      expect(tracker).toBe('ip:10.0.0.5')
    })
  })

  describe('shouldApplyAuthTier', () => {
    it('should apply auth tier for sign-in path', () => {
      // Arrange
      const { guard } = createGuard()
      const { context } = createMockContext({ url: '/api/auth/sign-in' })
      // Wire getRequestResponse
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      // Act
      const result = (guard as any).shouldApplyAuthTier(context)

      // Assert
      expect(result).toBe(true)
    })

    it('should apply auth tier for sign-up path', () => {
      // Arrange
      const { guard } = createGuard()
      const { context } = createMockContext({ url: '/api/auth/sign-up' })
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      // Act
      const result = (guard as any).shouldApplyAuthTier(context)

      // Assert
      expect(result).toBe(true)
    })

    it('should apply auth tier for password reset paths', () => {
      // Arrange
      const { guard } = createGuard()
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      for (const path of ['/api/auth/request-password-reset', '/api/auth/reset-password']) {
        const { context } = createMockContext({ url: path })

        // Act
        const result = (guard as any).shouldApplyAuthTier(context)

        // Assert
        expect(result).toBe(true)
      }
    })

    it('should apply auth tier for all auth-sensitive paths', () => {
      // Arrange
      const { guard } = createGuard()
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      // Act + Assert
      for (const path of AUTH_SENSITIVE_PATHS) {
        const { context } = createMockContext({ url: path })
        expect((guard as any).shouldApplyAuthTier(context)).toBe(true)
      }
    })

    it('should NOT apply auth tier for /api/auth/session', () => {
      // Arrange
      const { guard } = createGuard()
      const { context } = createMockContext({ url: '/api/auth/session' })
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      // Act
      const result = (guard as any).shouldApplyAuthTier(context)

      // Assert
      expect(result).toBe(false)
    })

    it('should NOT apply auth tier for /api/auth/providers', () => {
      // Arrange
      const { guard } = createGuard()
      const { context } = createMockContext({ url: '/api/auth/providers' })
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      // Act
      const result = (guard as any).shouldApplyAuthTier(context)

      // Assert
      expect(result).toBe(false)
    })

    it('should strip query string before matching', () => {
      // Arrange
      const { guard } = createGuard()
      const { context } = createMockContext({ url: '/api/auth/sign-in?redirect=/dashboard' })
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      // Act
      const result = (guard as any).shouldApplyAuthTier(context)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('rate limit disabled', () => {
    it('should skip throttling when RATE_LIMIT_ENABLED=false', async () => {
      // Arrange
      const { guard } = createGuard({ rateLimitEnabled: 'false' })
      const { context } = createMockContext()

      // Act
      const result = await guard.canActivate(context as never)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('handleRequest', () => {
    it('should skip auth tier for non-sensitive auth paths', async () => {
      // Arrange
      const { guard, storageService } = createGuard()
      const { context } = createMockContext({ url: '/api/auth/session' })
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      const requestProps = {
        context,
        limit: 5,
        ttl: 60_000,
        throttler: { name: 'auth' },
        blockDuration: 300_000,
        generateKey: vi.fn().mockReturnValue('test-key'),
      }

      // Act
      const result = await (guard as any).handleRequest(requestProps)

      // Assert -- should return true without calling storageService
      expect(result).toBe(true)
      expect(storageService.increment).not.toHaveBeenCalled()
    })

    it('should store throttlerMeta on request', async () => {
      // Arrange
      const { guard, storageService } = createGuard()
      storageService.increment.mockResolvedValue({
        totalHits: 3,
        timeToExpire: 45_000,
        isBlocked: false,
        timeToBlockExpire: 0,
      })
      const { context, req } = createMockContext({ url: '/api/users' })
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      const requestProps = {
        context,
        limit: 60,
        ttl: 60_000,
        throttler: { name: 'global' },
        blockDuration: 0,
        generateKey: vi.fn().mockReturnValue('test-key'),
      }

      // Act
      await (guard as any).handleRequest(requestProps)

      // Assert
      expect(req.throttlerMeta).toBeDefined()
      expect(req.throttlerMeta).toMatchObject({
        limit: 60,
        remaining: 57,
        tierName: 'global',
        tracker: 'ip:127.0.0.1',
      })
      expect((req.throttlerMeta as { reset: number }).reset).toBeTypeOf('number')
    })

    it('should throw ThrottlerException when totalHits exceeds limit', async () => {
      // Arrange
      const { guard, storageService } = createGuard()
      storageService.increment.mockResolvedValue({
        totalHits: 61,
        timeToExpire: 30_000,
        isBlocked: false,
        timeToBlockExpire: 0,
      })
      const { context } = createMockContext({ url: '/api/users' })
      ;(guard as any).getRequestResponse = (ctx: any) => ({
        req: ctx.switchToHttp().getRequest(),
        res: ctx.switchToHttp().getResponse(),
      })

      const requestProps = {
        context,
        limit: 60,
        ttl: 60_000,
        throttler: { name: 'global' },
        blockDuration: 0,
        generateKey: vi.fn().mockReturnValue('test-key'),
      }

      // Act + Assert
      await expect((guard as any).handleRequest(requestProps)).rejects.toThrow(ThrottlerException)
    })
  })

  describe('throwThrottlingException', () => {
    it('should throw ThrottlerException without setting response headers', async () => {
      // Arrange
      const { guard } = createGuard()
      const { context } = createMockContext()
      const headerFn = vi.fn()
      ;(guard as any).getRequestResponse = () => ({
        req: {},
        res: { header: headerFn },
      })

      // Act + Assert
      await expect(
        (guard as any).throwThrottlingException(context, {
          limit: 60,
          ttl: 60_000,
          key: 'test-key',
          tracker: 'ip:127.0.0.1',
          totalHits: 61,
          timeToExpire: 30_000,
          isBlocked: false,
          timeToBlockExpire: 0,
        })
      ).rejects.toThrow(ThrottlerException)

      // Verify no headers were set (the filter handles them)
      expect(headerFn).not.toHaveBeenCalled()
    })
  })
})
