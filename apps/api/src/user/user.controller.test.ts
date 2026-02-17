import { beforeEach, describe, expect, it, vi } from 'vitest'
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
      const session = { user: { id: 'user-1' } }
      vi.mocked(mockUserService.getProfile).mockResolvedValue(mockUser)

      const result = await controller.getMe(session)

      expect(result).toEqual(mockUser)
      expect(mockUserService.getProfile).toHaveBeenCalledWith('user-1')
    })

    it('should propagate UserNotFoundException when user not found', async () => {
      const session = { user: { id: 'nonexistent' } }
      vi.mocked(mockUserService.getProfile).mockRejectedValue(
        new UserNotFoundException('nonexistent')
      )

      await expect(controller.getMe(session)).rejects.toThrow(UserNotFoundException)
    })
  })

  describe('updateMe', () => {
    it('should update user profile', async () => {
      const session = { user: { id: 'user-1' } }
      const updateData = { firstName: 'Jane' }
      const updatedUser = { ...mockUser, firstName: 'Jane', fullName: 'Jane Doe' }
      vi.mocked(mockUserService.updateProfile).mockResolvedValue(updatedUser)

      const result = await controller.updateMe(session, updateData)

      expect(result).toEqual(updatedUser)
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-1', updateData)
    })

    it('should propagate UserNotFoundException when user not found', async () => {
      const session = { user: { id: 'nonexistent' } }
      const updateData = { firstName: 'Ghost' }
      vi.mocked(mockUserService.updateProfile).mockRejectedValue(
        new UserNotFoundException('nonexistent')
      )

      await expect(controller.updateMe(session, updateData)).rejects.toThrow(UserNotFoundException)
    })
  })

  describe('deleteMe', () => {
    it('should initiate account soft-deletion', async () => {
      const session = { user: { id: 'user-1' } }
      const body = { confirmEmail: 'john@example.com', orgResolutions: [] as never[] }
      const deletedUser = {
        ...mockUser,
        deletedAt: new Date(),
        deleteScheduledFor: new Date(),
      }
      vi.mocked(mockUserService.softDelete).mockResolvedValue(deletedUser)

      const result = await controller.deleteMe(session, body)

      expect(result).toEqual(deletedUser)
      expect(mockUserService.softDelete).toHaveBeenCalledWith('user-1', 'john@example.com', [])
    })
  })

  describe('reactivateMe', () => {
    it('should reactivate a soft-deleted account', async () => {
      const session = { user: { id: 'user-1' } }
      vi.mocked(mockUserService.reactivate).mockResolvedValue(mockUser)

      const result = await controller.reactivateMe(session)

      expect(result).toEqual(mockUser)
      expect(mockUserService.reactivate).toHaveBeenCalledWith('user-1')
    })
  })
})
