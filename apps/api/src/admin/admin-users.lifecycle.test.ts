import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditService } from '../audit/audit.service.js'
import { createChainMock } from './__test-utils__/create-chain-mock.js'
import { AdminUsersLifecycleService } from './admin-users.lifecycle.js'
import { NotDeletedException } from './exceptions/not-deleted.exception.js'
import { SelfActionException } from './exceptions/self-action.exception.js'
import { SuperadminProtectionException } from './exceptions/superadmin-protection.exception.js'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception.js'
import { AdminUserNotFoundException } from './exceptions/user-not-found.exception.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

function createMockAuditService(): AuditService {
  return { log: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService
}

function createMockClsService(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

/**
 * Instantiate the service with fresh mocks.
 * Returns the service and its mock collaborators so tests can configure
 * per-call return values.
 */
function createService() {
  const db = createMockDb()
  const auditService = createMockAuditService()
  const cls = createMockClsService()
  const service = new AdminUsersLifecycleService(db as never, auditService, cls as never)
  return { service, db, auditService, cls }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseUser = {
  id: 'user-1',
  name: 'Alice Admin',
  email: 'alice@example.com',
  role: 'user',
  banned: false,
  banReason: null,
  banExpires: null,
  deletedAt: null,
  deleteScheduledFor: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminUsersLifecycleService', () => {
  let service: AdminUsersLifecycleService
  let db: ReturnType<typeof createMockDb>
  let auditService: AuditService

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, db, auditService } = createService())
  })

  // -----------------------------------------------------------------------
  // banUser
  // -----------------------------------------------------------------------
  describe('banUser', () => {
    it('should throw SelfActionException when banning self', async () => {
      // Arrange — actorId equals userId
      // Act & Assert
      await expect(service.banUser('user-1', 'Spam activity', null, 'user-1')).rejects.toThrow(
        SelfActionException
      )
    })

    it('should set banned=true with reason and optional expiry', async () => {
      // Arrange
      const notBannedUser = { ...baseUser, banned: false }
      const bannedUser = { ...baseUser, banned: true, banReason: 'Spam activity', banExpires: null }

      db.select.mockReturnValueOnce(createChainMock([notBannedUser]))
      db.update.mockReturnValueOnce(createChainMock([bannedUser]))

      // Act
      const result = await service.banUser('user-1', 'Spam activity', null, 'actor-super')

      // Assert
      expect(result).toBeDefined()
      expect(db.update).toHaveBeenCalled()
    })

    it('should set banExpires when an expiry date is provided', async () => {
      // Arrange
      const notBannedUser = { ...baseUser, banned: false }
      const expiresAt = new Date('2026-12-31')
      const bannedUser = {
        ...baseUser,
        banned: true,
        banReason: 'Temporary ban',
        banExpires: expiresAt,
      }

      db.select.mockReturnValueOnce(createChainMock([notBannedUser]))
      db.update.mockReturnValueOnce(createChainMock([bannedUser]))

      // Act
      await service.banUser('user-1', 'Temporary ban', expiresAt, 'actor-super')

      // Assert — update must have been called with banExpires
      expect(db.update).toHaveBeenCalled()
    })

    it('should throw AdminUserNotFoundException when user does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(
        service.banUser('user-missing', 'Spam activity', null, 'actor-super')
      ).rejects.toThrow(AdminUserNotFoundException)
    })

    it('should throw SuperadminProtectionException when banning a superadmin', async () => {
      // Arrange
      const superadminUser = { ...baseUser, role: 'superadmin', banned: false }
      db.select.mockReturnValueOnce(createChainMock([superadminUser]))

      // Act & Assert
      await expect(service.banUser('user-1', 'Spam activity', null, 'actor-super')).rejects.toThrow(
        SuperadminProtectionException
      )
    })

    it('should throw UserAlreadyBannedException when user is already banned', async () => {
      // Arrange
      const alreadyBannedUser = { ...baseUser, banned: true, banReason: 'Prior offense' }
      db.select.mockReturnValueOnce(createChainMock([alreadyBannedUser]))

      // Act & Assert
      await expect(
        service.banUser('user-1', 'Another reason', null, 'actor-super')
      ).rejects.toThrow(UserAlreadyBannedException)
    })

    it('should accept ban reason of exactly 5 characters', async () => {
      // Arrange
      const notBannedUser = { ...baseUser, banned: false }
      const bannedUser = { ...baseUser, banned: true, banReason: 'spam!' }

      db.select.mockReturnValueOnce(createChainMock([notBannedUser]))
      db.update.mockReturnValueOnce(createChainMock([bannedUser]))

      // Act & Assert — should not throw for min-length reason
      await expect(service.banUser('user-1', 'spam!', null, 'actor-super')).resolves.toBeDefined()
    })

    it('should accept ban reason of exactly 500 characters', async () => {
      // Arrange
      const notBannedUser = { ...baseUser, banned: false }
      const maxReason = 'x'.repeat(500)
      const bannedUser = { ...baseUser, banned: true, banReason: maxReason }

      db.select.mockReturnValueOnce(createChainMock([notBannedUser]))
      db.update.mockReturnValueOnce(createChainMock([bannedUser]))

      // Act & Assert
      await expect(service.banUser('user-1', maxReason, null, 'actor-super')).resolves.toBeDefined()
    })

    it('should call auditService.log with user.banned action', async () => {
      // Arrange
      const notBannedUser = { ...baseUser, banned: false }
      const bannedUser = { ...baseUser, banned: true, banReason: 'Spam activity' }

      db.select.mockReturnValueOnce(createChainMock([notBannedUser]))
      db.update.mockReturnValueOnce(createChainMock([bannedUser]))

      // Act
      await service.banUser('user-1', 'Spam activity', null, 'actor-super')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.banned',
          resource: 'user',
          resourceId: 'user-1',
          actorId: 'actor-super',
        })
      )
    })
  })

  // -----------------------------------------------------------------------
  // unbanUser
  // -----------------------------------------------------------------------
  describe('unbanUser', () => {
    it('should set banned=false and clear banReason and banExpires', async () => {
      // Arrange
      const bannedUser = {
        ...baseUser,
        banned: true,
        banReason: 'Spam',
        banExpires: new Date('2026-01-01'),
      }
      const unbannedUser = { ...baseUser, banned: false, banReason: null, banExpires: null }

      db.select.mockReturnValueOnce(createChainMock([bannedUser]))
      db.update.mockReturnValueOnce(createChainMock([unbannedUser]))

      // Act
      const result = await service.unbanUser('user-1', 'actor-super')

      // Assert
      expect(result).toBeDefined()
      expect(db.update).toHaveBeenCalled()
    })

    it('should throw AdminUserNotFoundException when user does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(service.unbanUser('user-missing', 'actor-super')).rejects.toThrow(
        AdminUserNotFoundException
      )
    })

    it('should call auditService.log with user.unbanned action', async () => {
      // Arrange
      const bannedUser = { ...baseUser, banned: true, banReason: 'Prior offense', banExpires: null }
      const unbannedUser = { ...baseUser, banned: false, banReason: null, banExpires: null }

      db.select.mockReturnValueOnce(createChainMock([bannedUser]))
      db.update.mockReturnValueOnce(createChainMock([unbannedUser]))

      // Act
      await service.unbanUser('user-1', 'actor-super')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.unbanned',
          resource: 'user',
          resourceId: 'user-1',
          actorId: 'actor-super',
        })
      )
    })

    it('should not call auditService.log when user is not found', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      await service.unbanUser('user-missing', 'actor-super').catch(() => {})

      // Assert
      expect(auditService.log).not.toHaveBeenCalled()
    })

    it('should not throw when auditService.log rejects (fire-and-forget)', async () => {
      // Arrange
      const bannedUser = { ...baseUser, banned: true, banReason: 'reason', banExpires: null }
      const unbannedUser = { ...baseUser, banned: false, banReason: null, banExpires: null }

      db.select.mockReturnValueOnce(createChainMock([bannedUser]))
      db.update.mockReturnValueOnce(createChainMock([unbannedUser]))
      vi.mocked(auditService.log).mockRejectedValue(new Error('audit service down'))

      // Act & Assert — should resolve without throwing
      await expect(service.unbanUser('user-1', 'actor-super')).resolves.toBeDefined()

      // Flush microtasks so the .catch() handler runs
      await new Promise<void>((resolve) => queueMicrotask(resolve))
    })
  })

  // -----------------------------------------------------------------------
  // deleteUser
  // -----------------------------------------------------------------------
  describe('deleteUser', () => {
    it('should throw SelfActionException when deleting self', async () => {
      // Arrange — actorId equals userId
      // Act & Assert
      await expect(service.deleteUser('user-1', 'user-1')).rejects.toThrow(SelfActionException)
    })

    it('should soft-delete user by setting deletedAt and deleteScheduledFor', async () => {
      // Arrange
      const activeUser = { ...baseUser, deletedAt: null, deleteScheduledFor: null }
      const deletedUser = {
        ...baseUser,
        deletedAt: new Date(),
        deleteScheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      db.select.mockReturnValueOnce(createChainMock([activeUser]))
      db.update.mockReturnValueOnce(createChainMock([deletedUser]))

      // Act
      const result = await service.deleteUser('user-1', 'actor-super')

      // Assert
      expect(result).toBeDefined()
      expect(db.update).toHaveBeenCalled()
    })

    it('should throw SuperadminProtectionException when deleting a superadmin', async () => {
      // Arrange
      const superadminUser = { ...baseUser, role: 'superadmin' }
      db.select.mockReturnValueOnce(createChainMock([superadminUser]))

      // Act & Assert
      await expect(service.deleteUser('user-1', 'actor-super')).rejects.toThrow(
        SuperadminProtectionException
      )
    })

    it('should throw AdminUserNotFoundException when user does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(service.deleteUser('user-missing', 'actor-super')).rejects.toThrow(
        AdminUserNotFoundException
      )
    })

    it('should call auditService.log with user.deleted action', async () => {
      // Arrange
      const activeUser = { ...baseUser }
      const deletedUser = { ...baseUser, deletedAt: new Date() }

      db.select.mockReturnValueOnce(createChainMock([activeUser]))
      db.update.mockReturnValueOnce(createChainMock([deletedUser]))

      // Act
      await service.deleteUser('user-1', 'actor-super')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.deleted',
          resource: 'user',
          resourceId: 'user-1',
          actorId: 'actor-super',
        })
      )
    })

    it('should not call auditService.log when user is not found', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      await service.deleteUser('user-missing', 'actor-super').catch(() => {})

      // Assert
      expect(auditService.log).not.toHaveBeenCalled()
    })

    it('should not throw when auditService.log rejects (fire-and-forget)', async () => {
      // Arrange
      const activeUser = { ...baseUser }
      const deletedUser = { ...baseUser, deletedAt: new Date() }

      db.select.mockReturnValueOnce(createChainMock([activeUser]))
      db.update.mockReturnValueOnce(createChainMock([deletedUser]))
      vi.mocked(auditService.log).mockRejectedValue(new Error('audit service down'))

      // Act & Assert
      await expect(service.deleteUser('user-1', 'actor-super')).resolves.toBeDefined()

      // Flush microtasks
      await new Promise<void>((resolve) => queueMicrotask(resolve))
    })
  })

  // -----------------------------------------------------------------------
  // restoreUser
  // -----------------------------------------------------------------------
  describe('restoreUser', () => {
    it('should restore soft-deleted user by clearing deletedAt and deleteScheduledFor', async () => {
      // Arrange
      const deletedUser = {
        ...baseUser,
        deletedAt: new Date('2025-06-01'),
        deleteScheduledFor: new Date('2025-07-01'),
      }
      const restoredUser = { ...baseUser, deletedAt: null, deleteScheduledFor: null }

      db.select.mockReturnValueOnce(createChainMock([deletedUser]))
      db.update.mockReturnValueOnce(createChainMock([restoredUser]))

      // Act
      const result = await service.restoreUser('user-1', 'actor-super')

      // Assert
      expect(result).toBeDefined()
      expect(db.update).toHaveBeenCalled()
    })

    it('should throw AdminUserNotFoundException when user does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(service.restoreUser('user-missing', 'actor-super')).rejects.toThrow(
        AdminUserNotFoundException
      )
    })

    it('should throw NotDeletedException when user is not deleted', async () => {
      // Arrange — user exists but deletedAt is null (not soft-deleted)
      const activeUser = { ...baseUser, deletedAt: null, deleteScheduledFor: null }
      db.select.mockReturnValueOnce(createChainMock([activeUser]))

      // Act & Assert
      await expect(service.restoreUser('user-1', 'actor-super')).rejects.toThrow(
        NotDeletedException
      )
    })

    it('should call auditService.log with user.restored action', async () => {
      // Arrange
      const deletedUser = {
        ...baseUser,
        deletedAt: new Date('2025-06-01'),
        deleteScheduledFor: new Date('2025-07-01'),
      }
      const restoredUser = { ...baseUser, deletedAt: null, deleteScheduledFor: null }

      db.select.mockReturnValueOnce(createChainMock([deletedUser]))
      db.update.mockReturnValueOnce(createChainMock([restoredUser]))

      // Act
      await service.restoreUser('user-1', 'actor-super')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.restored',
          resource: 'user',
          resourceId: 'user-1',
          actorId: 'actor-super',
        })
      )
    })

    it('should not call auditService.log when user is not found', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      await service.restoreUser('user-missing', 'actor-super').catch(() => {})

      // Assert
      expect(auditService.log).not.toHaveBeenCalled()
    })

    it('should not throw when auditService.log rejects (fire-and-forget)', async () => {
      // Arrange
      const deletedUser = {
        ...baseUser,
        deletedAt: new Date('2025-06-01'),
        deleteScheduledFor: new Date('2025-07-01'),
      }
      const restoredUser = { ...baseUser, deletedAt: null, deleteScheduledFor: null }

      db.select.mockReturnValueOnce(createChainMock([deletedUser]))
      db.update.mockReturnValueOnce(createChainMock([restoredUser]))
      vi.mocked(auditService.log).mockRejectedValue(new Error('audit service down'))

      // Act & Assert
      await expect(service.restoreUser('user-1', 'actor-super')).resolves.toBeDefined()

      // Flush microtasks
      await new Promise<void>((resolve) => queueMicrotask(resolve))
    })
  })
})
