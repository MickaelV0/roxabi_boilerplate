import { describe, expect, it, vi } from 'vitest'
import { AuthService } from './auth.service.js'

const mockHandler = vi.fn()
const mockGetSession = vi.fn()

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

const baseConfigValues = {
  BETTER_AUTH_SECRET: 'test-secret',
  BETTER_AUTH_URL: 'http://localhost:3001',
  APP_URL: 'http://localhost:3000',
}

describe('AuthService', () => {
  describe('constructor', () => {
    it('should detect enabled OAuth providers from config', () => {
      // Arrange
      const config = createMockConfig({
        ...baseConfigValues,
        GOOGLE_CLIENT_ID: 'google-id',
        GOOGLE_CLIENT_SECRET: 'google-secret',
      })

      // Act
      const service = new AuthService({} as never, {} as never, config as never)

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
      const service = new AuthService({} as never, {} as never, config as never)

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
      const service = new AuthService({} as never, {} as never, config as never)

      // Assert
      expect(service.enabledProviders.github).toBe(false)
    })

    it('should throw when BETTER_AUTH_SECRET is missing', () => {
      // Arrange
      const config = createMockConfig({})

      // Act & Assert
      expect(() => new AuthService({} as never, {} as never, config as never)).toThrow(
        'Missing config key: BETTER_AUTH_SECRET'
      )
    })
  })

  describe('handler', () => {
    it('should delegate to the BetterAuth handler', async () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)
      const service = new AuthService({} as never, {} as never, config as never)
      const mockRequest = new Request('http://localhost:3001/api/auth/signin')
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
      const service = new AuthService({} as never, {} as never, config as never)
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
      expect(result).toBe(mockSession)
    })

    it('should return null when no session exists', async () => {
      // Arrange
      const config = createMockConfig(baseConfigValues)
      const service = new AuthService({} as never, {} as never, config as never)
      const mockFastifyRequest = { headers: {} }
      mockGetSession.mockResolvedValue(null)

      // Act
      const result = await service.getSession(mockFastifyRequest as never)

      // Assert
      expect(result).toBeNull()
    })
  })
})
