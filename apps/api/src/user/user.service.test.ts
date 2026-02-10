import { describe, expect, it, vi } from 'vitest'
import { UserNotFoundException } from './exceptions/user-not-found.exception.js'
import { UserService } from './user.service.js'

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

function createMockDb() {
  const limitFn = vi.fn()
  const selectWhereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: selectWhereFn })
  const selectFn = vi.fn().mockReturnValue({ from: fromFn })

  const returningFn = vi.fn()
  const updateWhereFn = vi.fn().mockReturnValue({ returning: returningFn })
  const setFn = vi.fn().mockReturnValue({ where: updateWhereFn })
  const updateFn = vi.fn().mockReturnValue({ set: setFn })

  return {
    db: { select: selectFn, update: updateFn },
    chains: {
      select: { from: fromFn, where: selectWhereFn, limit: limitFn },
      update: { set: setFn, where: updateWhereFn, returning: returningFn },
    },
  }
}

describe('UserService', () => {
  describe('getProfile', () => {
    it('should return user profile without sensitive fields', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([mockUser])

      const service = new UserService(db as never)
      const result = await service.getProfile('user-1')

      expect(result).toEqual(mockUser)
      expect(result).not.toHaveProperty('banned')
      expect(result).not.toHaveProperty('banReason')
      expect(result).not.toHaveProperty('banExpires')
      expect(db.select).toHaveBeenCalledWith(expect.objectContaining({ id: expect.anything() }))
      expect(chains.select.limit).toHaveBeenCalledWith(1)
    })

    it('should throw UserNotFoundException when user not found', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([])

      const service = new UserService(db as never)

      await expect(service.getProfile('nonexistent')).rejects.toThrow(UserNotFoundException)
    })
  })

  describe('updateProfile', () => {
    it('should update and return user without sensitive fields', async () => {
      const updatedUser = { ...mockUser, name: 'Jane Doe', updatedAt: new Date('2025-06-01') }
      const { db, chains } = createMockDb()
      chains.update.returning.mockResolvedValue([updatedUser])

      const service = new UserService(db as never)
      const result = await service.updateProfile('user-1', { name: 'Jane Doe' })

      expect(result).toEqual(updatedUser)
      expect(result).not.toHaveProperty('banned')
      expect(result).not.toHaveProperty('banReason')
      expect(result).not.toHaveProperty('banExpires')
      expect(db.update).toHaveBeenCalled()
      expect(chains.update.returning).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.anything() })
      )
    })
  })
})
