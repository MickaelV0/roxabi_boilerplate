import { describe, expect, it, vi } from 'vitest'
import type { AuthenticatedSession } from '../auth/types.js'
import { ApiKeyController } from './api-key.controller.js'

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function createMockApiKeyService() {
  return {
    create: vi.fn(),
    list: vi.fn(),
    revoke: vi.fn(),
  }
}

function createSession(overrides: Partial<AuthenticatedSession> = {}): AuthenticatedSession {
  return {
    user: { id: 'user-1' },
    session: { id: 'sess-1', activeOrganizationId: 'org-1' },
    permissions: ['api_keys:read', 'api_keys:write'],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApiKeyController', () => {
  describe('create()', () => {
    it('should delegate to apiKeyService.create with session and body', async () => {
      // Arrange
      const service = createMockApiKeyService()
      const expected = { id: 'key-1', key: 'sk_live_abc123', name: 'My Key' }
      service.create.mockResolvedValue(expected)
      const controller = new ApiKeyController(service as never)
      const session = createSession()
      const body = { name: 'My Key', scopes: ['api_keys:read'] }

      // Act
      const result = await controller.create(session, body)

      // Assert
      expect(service.create).toHaveBeenCalledWith(session, body)
      expect(result).toEqual(expected)
    })

    it('should propagate service errors', async () => {
      // Arrange
      const service = createMockApiKeyService()
      service.create.mockRejectedValue(new Error('Scopes exceeded'))
      const controller = new ApiKeyController(service as never)

      // Act & Assert
      await expect(
        controller.create(createSession(), { name: 'X', scopes: ['invalid'] })
      ).rejects.toThrow('Scopes exceeded')
    })
  })

  describe('list()', () => {
    it('should delegate to apiKeyService.list with activeOrganizationId', async () => {
      // Arrange
      const service = createMockApiKeyService()
      const expected = { data: [{ id: 'key-1', name: 'Key One' }] }
      service.list.mockResolvedValue(expected)
      const controller = new ApiKeyController(service as never)

      // Act
      const result = await controller.list(createSession())

      // Assert
      expect(service.list).toHaveBeenCalledWith('org-1')
      expect(result).toEqual(expected)
    })
  })

  describe('revoke()', () => {
    it('should delegate to apiKeyService.revoke with id, orgId, and userId', async () => {
      // Arrange
      const service = createMockApiKeyService()
      const expected = { id: 'key-1', revokedAt: '2024-06-01T00:00:00.000Z' }
      service.revoke.mockResolvedValue(expected)
      const controller = new ApiKeyController(service as never)

      // Act
      const result = await controller.revoke('key-1', createSession())

      // Assert
      expect(service.revoke).toHaveBeenCalledWith('key-1', 'org-1', 'user-1')
      expect(result).toEqual(expected)
    })

    it('should propagate service errors for non-existent keys', async () => {
      // Arrange
      const service = createMockApiKeyService()
      service.revoke.mockRejectedValue(new Error('Not found'))
      const controller = new ApiKeyController(service as never)

      // Act & Assert
      await expect(controller.revoke('nonexistent', createSession())).rejects.toThrow('Not found')
    })
  })
})
