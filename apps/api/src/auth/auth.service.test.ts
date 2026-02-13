import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PermissionService } from '../rbac/permission.service.js'
import { AuthService } from './auth.service.js'

const mockHandler = vi.fn()
const mockGetSession = vi.fn()

// vi.mock is required here because createBetterAuth is called inside the constructor,
// not injected via DI, so it cannot be stubbed through dependency injection.
vi.mock('./auth.instance.js', () => ({
  createBetterAuth: vi.fn(() => ({
    handler: mockHandler,
    api: { getSession: mockGetSession },
  })),
}))

function createMockConfig(values: Record<string, string | undefined> = {}) {
  return {
    get: vi.fn((key: string, defaultValue?: string) => values[key] ?? defaultValue),
    getOrThrow: vi.fn((key: string) => {
      const value = values[key]
      if (value === undefined) throw new Error(`Missing config key: ${key}`)
      return value
    }),
  }
}

const mockEventEmitter = { emit: vi.fn(), emitAsync: vi.fn().mockResolvedValue([]) }
const mockPermissionService = {
  getPermissions: vi.fn().mockResolvedValue([]),
} as unknown as PermissionService

const baseConfigValues = {
  BETTER_AUTH_SECRET: 'test-secret',
  BETTER_AUTH_URL: 'http://localhost:4000',
  APP_URL: 'http://localhost:3000',
}

function createService(config: ReturnType<typeof createMockConfig>) {
  return new AuthService(
    {} as never,
    {} as never,
    config as never,
    mockEventEmitter as never,
    mockPermissionService
  )
}

describe('AuthService', () => {
  beforeEach(() => {
    mockHandler.mockReset()
    mockGetSession.mockReset()
    mockEventEmitter.emit.mockReset()
    mockEventEmitter.emitAsync.mockReset().mockResolvedValue([])
    ;(mockPermissionService.getPermissions as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockResolvedValue([])
  })

  describe('constructor', () => {
    it('should detect enabled OAuth providers from config', () => {
      // Arrange
      const config = createMockConfig({
        ...baseConfigValues,
        GOOGLE_CLIENT_ID: 'google-id',
        GOOGLE_CLIENT_SECRET: 'google-secret',
      })

      // Act
      // db and emailProvider are passed through to mocked createBetterAuth, so empty stubs are safe
      const service = createService(config)

      // Assert
      expect(service.enabledProviders).toEqual({
        google: true,
        github: false,
      })
    })

    it('should report no providers when none are configured', () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)

      // Act
      const service = createService(config)

      // Assert
      expect(service.enabledProviders).toEqual({
        google: false,
        github: false,
      })
    })

    it('should require both client ID and secret for a provider to be enabled', () => {
      // Arrange — only ID, no secret
      const config = createMockConfig({
        ...baseConfigValues,
        GITHUB_CLIENT_ID: 'gh-id',
      })

      // Act
      const service = createService(config)

      // Assert
      expect(service.enabledProviders.github).toBe(false)
    })

    it('should throw when BETTER_AUTH_SECRET is missing', () => {
      // Arrange
      const config = createMockConfig({})

      // Act & Assert
      expect(() => createService(config)).toThrow('Missing config key: BETTER_AUTH_SECRET')
    })
  })

  describe('handler', () => {
    it('should delegate to the BetterAuth handler', async () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)
      const service = createService(config)
      const mockRequest = new Request('http://localhost:4000/api/auth/signin')
      const mockResponse = new Response('ok')
      mockHandler.mockResolvedValue(mockResponse)

      // Act
      const result = await service.handler(mockRequest)

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(mockRequest)
      expect(result).toBe(mockResponse)
    })
  })

  describe('getSession', () => {
    it('should convert Fastify headers and delegate to BetterAuth API', async () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)
      const service = createService(config)
      const mockFastifyRequest = {
        headers: {
          cookie: 'session=abc123',
          host: 'localhost:3001',
        },
      }
      const mockSession = { user: { id: 'user-1' }, session: { id: 'sess-1' } }
      mockGetSession.mockResolvedValue(mockSession)

      // Act
      const result = await service.getSession(mockFastifyRequest as never)

      // Assert
      expect(mockGetSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      })
      const calledHeaders = mockGetSession.mock.calls[0]?.[0]?.headers as Headers
      expect(calledHeaders.get('cookie')).toBe('session=abc123')
      expect(result).toEqual({ ...mockSession, permissions: [] })
    })

    it('should enrich session with permissions when activeOrganizationId and user.id exist', async () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)
      const service = createService(config)
      const mockFastifyRequest = { headers: { cookie: 'session=abc' } }
      const mockSession = {
        user: { id: 'user-1' },
        session: { id: 'sess-1', activeOrganizationId: 'org-1' },
      }
      mockGetSession.mockResolvedValue(mockSession)
      ;(mockPermissionService.getPermissions as ReturnType<typeof vi.fn>).mockResolvedValue([
        'roles:read',
        'members:write',
      ])

      // Act
      const result = await service.getSession(mockFastifyRequest as never)

      // Assert
      expect(mockPermissionService.getPermissions).toHaveBeenCalledWith('user-1', 'org-1')
      expect(result).toEqual({ ...mockSession, permissions: ['roles:read', 'members:write'] })
    })

    it('should return empty permissions when activeOrganizationId exists but user.id is missing', async () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)
      const service = createService(config)
      const mockFastifyRequest = { headers: { cookie: 'session=abc' } }
      const mockSession = {
        user: {},
        session: { id: 'sess-1', activeOrganizationId: 'org-1' },
      }
      mockGetSession.mockResolvedValue(mockSession)

      // Act
      const result = await service.getSession(mockFastifyRequest as never)

      // Assert
      expect(mockPermissionService.getPermissions).not.toHaveBeenCalled()
      expect(result).toEqual({ ...mockSession, permissions: [] })
    })

    it('should return null when no session exists', async () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)
      const service = createService(config)
      const mockFastifyRequest = { headers: {} }
      mockGetSession.mockResolvedValue(null)

      // Act
      const result = await service.getSession(mockFastifyRequest as never)

      // Assert
      expect(result).toBeNull()
    })
  })
})
