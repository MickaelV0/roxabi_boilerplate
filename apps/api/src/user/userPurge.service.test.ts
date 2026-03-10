import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountNotDeletedException } from './exceptions/accountNotDeleted.exception.js'
import { EmailConfirmationMismatchException } from './exceptions/emailConfirmationMismatch.exception.js'
import { UserNotFoundException } from './exceptions/userNotFound.exception.js'
import type { UserPurgeRepository } from './userPurge.repository.js'
import { UserPurgeService } from './userPurge.service.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUserPurgeRepo(): UserPurgeRepository {
  return {
    findForPurgeValidation: vi.fn(),
    anonymizeUserRecords: vi.fn().mockResolvedValue(undefined),
    purgeOwnedOrganizations: vi.fn().mockResolvedValue(undefined),
  } as unknown as UserPurgeRepository
}

function createService() {
  const repo = createMockUserPurgeRepo()
  const service = new UserPurgeService(repo as never)
  return { service, repo }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseUser = {
  id: 'user-1',
  email: 'alice@example.com',
  deletedAt: new Date('2026-01-01T00:00:00.000Z'),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserPurgeService', () => {
  let service: UserPurgeService
  let repo: UserPurgeRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, repo } = createService())
  })

  // -----------------------------------------------------------------------
  // validatePurgeEligibility
  // -----------------------------------------------------------------------
  describe('validatePurgeEligibility', () => {
    it('should throw UserNotFoundException when user does not exist', async () => {
      // Arrange
      ;(repo.findForPurgeValidation as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.validatePurgeEligibility('nonexistent', 'alice@example.com')
      ).rejects.toThrow(UserNotFoundException)
    })

    it('should throw AccountNotDeletedException when user is not soft-deleted', async () => {
      // Arrange
      const activeUser = { ...baseUser, deletedAt: null }
      ;(repo.findForPurgeValidation as ReturnType<typeof vi.fn>).mockResolvedValue(activeUser)

      // Act & Assert
      await expect(service.validatePurgeEligibility('user-1', 'alice@example.com')).rejects.toThrow(
        AccountNotDeletedException
      )
    })

    it('should throw EmailConfirmationMismatchException when email does not match', async () => {
      // Arrange
      ;(repo.findForPurgeValidation as ReturnType<typeof vi.fn>).mockResolvedValue(baseUser)

      // Act & Assert
      await expect(service.validatePurgeEligibility('user-1', 'wrong@example.com')).rejects.toThrow(
        EmailConfirmationMismatchException
      )
    })

    it('should accept case-insensitive email confirmation', async () => {
      // Arrange
      const userWithMixedCaseEmail = { ...baseUser, email: 'Alice@Example.COM' }
      ;(repo.findForPurgeValidation as ReturnType<typeof vi.fn>).mockResolvedValue(
        userWithMixedCaseEmail
      )

      // Act & Assert -- should resolve without throwing
      await expect(
        service.validatePurgeEligibility('user-1', 'alice@example.com')
      ).resolves.toBeDefined()
    })

    it('should return user when all conditions are met', async () => {
      // Arrange
      ;(repo.findForPurgeValidation as ReturnType<typeof vi.fn>).mockResolvedValue(baseUser)

      // Act
      const result = await service.validatePurgeEligibility('user-1', 'alice@example.com')

      // Assert
      expect(result).toEqual(baseUser)
    })

    it('should allow purge even within what would be a grace period (user-initiated bypass)', async () => {
      // Arrange — deletedAt is very recent (same day)
      const justDeletedUser = {
        ...baseUser,
        deletedAt: new Date(),
      }
      ;(repo.findForPurgeValidation as ReturnType<typeof vi.fn>).mockResolvedValue(justDeletedUser)

      // Act & Assert -- grace period is intentionally bypassed for user-initiated purge
      await expect(
        service.validatePurgeEligibility('user-1', 'alice@example.com')
      ).resolves.toEqual(justDeletedUser)
    })
  })

  // -----------------------------------------------------------------------
  // anonymizeUserRecords
  // -----------------------------------------------------------------------
  describe('anonymizeUserRecords', () => {
    it('should delegate to repo.anonymizeUserRecords with correct parameters', async () => {
      // Arrange
      const now = new Date('2026-03-01T00:00:00.000Z')

      // Act
      await service.anonymizeUserRecords('user-1', 'alice@example.com', now)

      // Assert
      expect(repo.anonymizeUserRecords).toHaveBeenCalledOnce()
      expect(repo.anonymizeUserRecords).toHaveBeenCalledWith(
        'user-1',
        'alice@example.com',
        now,
        undefined
      )
    })

    it('should pass tx to repo when provided', async () => {
      // Arrange
      const now = new Date()
      const mockTx = {} as never

      // Act
      await service.anonymizeUserRecords('user-1', 'alice@example.com', now, mockTx)

      // Assert
      expect(repo.anonymizeUserRecords).toHaveBeenCalledWith(
        'user-1',
        'alice@example.com',
        now,
        mockTx
      )
    })
  })

  // -----------------------------------------------------------------------
  // purgeOwnedOrganizations
  // -----------------------------------------------------------------------
  describe('purgeOwnedOrganizations', () => {
    it('should delegate to repo.purgeOwnedOrganizations with correct parameters', async () => {
      // Arrange
      const now = new Date()

      // Act
      await service.purgeOwnedOrganizations('user-1', now)

      // Assert
      expect(repo.purgeOwnedOrganizations).toHaveBeenCalledOnce()
      expect(repo.purgeOwnedOrganizations).toHaveBeenCalledWith('user-1', now, undefined)
    })

    it('should pass tx to repo when provided', async () => {
      // Arrange
      const now = new Date()
      const mockTx = {} as never

      // Act
      await service.purgeOwnedOrganizations('user-1', now, mockTx)

      // Assert
      expect(repo.purgeOwnedOrganizations).toHaveBeenCalledWith('user-1', now, mockTx)
    })
  })
})
