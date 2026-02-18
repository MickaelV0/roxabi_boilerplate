import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountNotDeletedException } from './exceptions/account-not-deleted.exception.js'
import { UserNotFoundException } from './exceptions/user-not-found.exception.js'
import { UserController } from './user.controller.js'
import type { UserService } from './user.service.js'

const mockUserService: UserService = {
  getSoftDeleteStatus: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  softDelete: vi.fn(),
  reactivate: vi.fn(),
  getOwnedOrganizations: vi.fn(),
  purge: vi.fn(),
} as unknown as UserService

describe('UserController', () => {
  const controller = new UserController(mockUserService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockUser = {
    id: 'user-1',
    fullName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    fullNameCustomized: false,
    email: 'john@example.com',
    emailVerified: true,
    image: null,
    avatarSeed: null,
    avatarStyle: 'lorelei',
    role: 'user',
    deletedAt: null,
    deleteScheduledFor: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  }

  describe('getMe', () => {
    it('should return user profile when session exists', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      vi.mocked(mockUserService.getProfile).mockResolvedValue(mockUser)

      // Act
      const result = await controller.getMe(session)

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockUserService.getProfile).toHaveBeenCalledWith('user-1')
    })

    it('should propagate UserNotFoundException when user not found', async () => {
      // Arrange
      const session = { user: { id: 'nonexistent' } }
      vi.mocked(mockUserService.getProfile).mockRejectedValue(
        new UserNotFoundException('nonexistent')
      )

      // Act & Assert
      await expect(controller.getMe(session)).rejects.toThrow(UserNotFoundException)
    })
  })

  describe('updateMe', () => {
    it('should update user profile', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const updateData = { firstName: 'Jane' }
      const updatedUser = { ...mockUser, firstName: 'Jane', fullName: 'Jane Doe' }
      vi.mocked(mockUserService.updateProfile).mockResolvedValue(updatedUser)

      // Act
      const result = await controller.updateMe(session, updateData)

      // Assert
      expect(result).toEqual(updatedUser)
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-1', updateData)
    })

    it('should propagate UserNotFoundException when user not found', async () => {
      // Arrange
      const session = { user: { id: 'nonexistent' } }
      const updateData = { firstName: 'Ghost' }
      vi.mocked(mockUserService.updateProfile).mockRejectedValue(
        new UserNotFoundException('nonexistent')
      )

      // Act & Assert
      await expect(controller.updateMe(session, updateData)).rejects.toThrow(UserNotFoundException)
    })
  })

  describe('deleteMe', () => {
    it('should initiate account soft-deletion', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const body = { confirmEmail: 'john@example.com', orgResolutions: [] as never[] }
      const deletedUser = {
        ...mockUser,
        deletedAt: new Date(),
        deleteScheduledFor: new Date(),
      }
      vi.mocked(mockUserService.softDelete).mockResolvedValue(deletedUser)

      // Act
      const result = await controller.deleteMe(session, body)

      // Assert
      expect(result).toEqual(deletedUser)
      expect(mockUserService.softDelete).toHaveBeenCalledWith('user-1', 'john@example.com', [])
    })
  })

  describe('reactivateMe', () => {
    it('should reactivate a soft-deleted account', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      vi.mocked(mockUserService.reactivate).mockResolvedValue(mockUser)

      // Act
      const result = await controller.reactivateMe(session)

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockUserService.reactivate).toHaveBeenCalledWith('user-1')
    })
  })

  describe('getOwnedOrganizations', () => {
    it('should call userService.getOwnedOrganizations and return the result', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const ownedOrgs = [
        { orgId: 'org-1', orgName: 'Org One', orgSlug: 'org-one' },
        { orgId: 'org-2', orgName: 'Org Two', orgSlug: 'org-two' },
      ]
      vi.mocked(mockUserService.getOwnedOrganizations).mockResolvedValue(ownedOrgs)

      // Act
      const result = await controller.getOwnedOrganizations(session)

      // Assert
      expect(result).toEqual(ownedOrgs)
      expect(mockUserService.getOwnedOrganizations).toHaveBeenCalledWith('user-1')
    })
  })

  describe('purgeMe', () => {
    it('should delegate to userService.purge and return the result', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const body = { confirmEmail: 'john@example.com' }
      const mockResponse = { clearCookie: vi.fn() } as never
      vi.mocked(mockUserService.purge).mockResolvedValue({ success: true })

      // Act
      const result = await controller.purgeMe(session, body, mockResponse)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockUserService.purge).toHaveBeenCalledWith('user-1', 'john@example.com')
    })

    it('should clear the session cookie after successful purge', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const body = { confirmEmail: 'john@example.com' }
      const clearCookieFn = vi.fn()
      const mockResponse = { clearCookie: clearCookieFn } as never
      vi.mocked(mockUserService.purge).mockResolvedValue({ success: true })

      // Act
      await controller.purgeMe(session, body, mockResponse)

      // Assert
      expect(clearCookieFn).toHaveBeenCalledWith('better-auth.session_token', { path: '/' })
    })

    it('should propagate AccountNotDeletedException when account is not soft-deleted', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const body = { confirmEmail: 'john@example.com' }
      const mockResponse = { clearCookie: vi.fn() } as never
      vi.mocked(mockUserService.purge).mockRejectedValue(new AccountNotDeletedException())

      // Act & Assert
      await expect(controller.purgeMe(session, body, mockResponse)).rejects.toThrow(
        AccountNotDeletedException
      )
    })
  })
})
