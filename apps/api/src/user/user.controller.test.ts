import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserNotFoundException } from './exceptions/user-not-found.exception.js'
import { UserController } from './user.controller.js'
import type { UserService } from './user.service.js'

const mockUserService: UserService = {
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
} as unknown as UserService

describe('UserController', () => {
  const controller = new UserController(mockUserService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
    image: null,
    role: 'user',
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
      const session = { user: { id: 'user-1' } }
      const updateData = { name: 'Jane Doe' }
      const updatedUser = { ...mockUser, name: 'Jane Doe' }
      vi.mocked(mockUserService.updateProfile).mockResolvedValue(updatedUser)

      const result = await controller.updateMe(session, updateData)

      expect(result).toEqual(updatedUser)
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-1', updateData)
    })

    it('should propagate UserNotFoundException when user not found', async () => {
      // Arrange
      const session = { user: { id: 'nonexistent' } }
      const updateData = { name: 'Ghost' }
      vi.mocked(mockUserService.updateProfile).mockRejectedValue(
        new UserNotFoundException('nonexistent')
      )

      // Act & Assert
      await expect(controller.updateMe(session, updateData)).rejects.toThrow(UserNotFoundException)
    })
  })
})
