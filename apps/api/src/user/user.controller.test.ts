import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { UserController } from './user.controller.js'
import type { UserService } from './user.service.js'

const mockUserService: UserService = {
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
} as unknown as UserService

describe('UserController', () => {
  const controller = new UserController(mockUserService)

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
    image: null,
    role: 'user',
    banned: false,
    banReason: null,
    banExpires: null,
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

    it('should throw UnauthorizedException when no session', async () => {
      await expect(controller.getMe(null)).rejects.toThrow(UnauthorizedException)
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

    it('should throw UnauthorizedException when no session', async () => {
      await expect(controller.updateMe(null, { name: 'Jane' })).rejects.toThrow(
        UnauthorizedException
      )
    })
  })
})
