import { describe, expect, it, vi } from 'vitest'
import { OrganizationSoftDeletedEvent } from '../common/events/organization-soft-deleted.event.js'
import { UserSoftDeletedEvent } from '../common/events/user-soft-deleted.event.js'
import { ApiKeyListener } from './api-key.listener.js'

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function createMockApiKeyService() {
  return {
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
    revokeAllForOrg: vi.fn().mockResolvedValue(undefined),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApiKeyListener', () => {
  describe('handleUserSoftDeleted()', () => {
    it('should call revokeAllForUser with the event userId', async () => {
      // Arrange
      const service = createMockApiKeyService()
      const listener = new ApiKeyListener(service as never)
      const event = new UserSoftDeletedEvent('user-42')

      // Act
      await listener.handleUserSoftDeleted(event)

      // Assert
      expect(service.revokeAllForUser).toHaveBeenCalledWith('user-42')
    })

    it('should propagate errors from the service', async () => {
      // Arrange
      const service = createMockApiKeyService()
      service.revokeAllForUser.mockRejectedValue(new Error('DB error'))
      const listener = new ApiKeyListener(service as never)
      const event = new UserSoftDeletedEvent('user-1')

      // Act & Assert
      await expect(listener.handleUserSoftDeleted(event)).rejects.toThrow('DB error')
    })
  })

  describe('handleOrgSoftDeleted()', () => {
    it('should call revokeAllForOrg with the event organizationId', async () => {
      // Arrange
      const service = createMockApiKeyService()
      const listener = new ApiKeyListener(service as never)
      const event = new OrganizationSoftDeletedEvent('org-99')

      // Act
      await listener.handleOrgSoftDeleted(event)

      // Assert
      expect(service.revokeAllForOrg).toHaveBeenCalledWith('org-99')
    })

    it('should propagate errors from the service', async () => {
      // Arrange
      const service = createMockApiKeyService()
      service.revokeAllForOrg.mockRejectedValue(new Error('Connection lost'))
      const listener = new ApiKeyListener(service as never)
      const event = new OrganizationSoftDeletedEvent('org-1')

      // Act & Assert
      await expect(listener.handleOrgSoftDeleted(event)).rejects.toThrow('Connection lost')
    })
  })
})
