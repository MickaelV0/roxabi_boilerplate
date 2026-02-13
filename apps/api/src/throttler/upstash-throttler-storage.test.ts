import { ServiceUnavailableException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Mock @upstash/redis before importing UpstashThrottlerStorage.
 *
 * The storage class instantiates `new Redis({ url, token })` in its constructor,
 * so we intercept it with a controllable mock class.
 */
const mockPipelineExec = vi.fn()
const mockExpire = vi.fn()
const mockSet = vi.fn()
const mockTtl = vi.fn()

const mockPipeline = {
  incr: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  ttl: vi.fn().mockReturnThis(),
  exec: mockPipelineExec,
}

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    pipeline() {
      return mockPipeline
    }
    ttl = mockTtl
    expire = mockExpire
    set = mockSet
  },
}))

// Import after mock is set up
const { UpstashThrottlerStorage } = await import('./upstash-throttler-storage.js')

function createStorage() {
  return new UpstashThrottlerStorage('https://test.upstash.io', 'test-token')
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UpstashThrottlerStorage', () => {
  describe('increment', () => {
    it('should return correct ThrottlerStorageRecord shape', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockResolvedValue(-2) // not blocked
      mockPipelineExec.mockResolvedValue([5, 1, 30]) // [totalHits, expireResult, ttl]

      // Act
      const result = await storage.increment('test-key', 60_000, 60, 0, 'global')

      // Assert
      expect(result).toEqual({
        totalHits: 5,
        timeToExpire: 30_000,
        isBlocked: false,
        timeToBlockExpire: 0,
      })
    })

    it('should increment hit count', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockResolvedValue(-2) // not blocked
      mockPipelineExec.mockResolvedValueOnce([1, 1, 60]) // first hit
      mockPipelineExec.mockResolvedValueOnce([2, 1, 59]) // second hit

      // Act
      const first = await storage.increment('counter-key', 60_000, 60, 0, 'global')
      const second = await storage.increment('counter-key', 60_000, 60, 0, 'global')

      // Assert
      expect(first.totalHits).toBe(1)
      expect(second.totalHits).toBe(2)
    })

    it('should include EXPIRE in the pipeline to prevent orphaned keys', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockResolvedValue(-2) // not blocked
      mockPipelineExec.mockResolvedValue([1, 1, 60]) // first hit

      // Act
      await storage.increment('new-key', 60_000, 60, 0, 'global')

      // Assert — EXPIRE is called on the pipeline, not standalone
      expect(mockPipeline.expire).toHaveBeenCalledWith('new-key', 60)
      expect(mockPipeline.incr).toHaveBeenCalledWith('new-key')
    })

    it('should set blocked state after exceeding limit with blockDuration', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockResolvedValue(-2) // not currently blocked
      mockPipelineExec.mockResolvedValue([6, 1, 55]) // [totalHits, expireResult, ttl]

      // Act
      const result = await storage.increment('auth-key', 60_000, 5, 300_000, 'auth')

      // Assert
      expect(result.isBlocked).toBe(true)
      expect(result.timeToBlockExpire).toBe(300_000)
      expect(result.totalHits).toBe(6)
      expect(mockSet).toHaveBeenCalledWith('auth-key:blocked', 1, { ex: 300 })
    })

    it('should return blocked record when block key has positive TTL', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockResolvedValue(120) // blocked for 120 more seconds

      // Act
      const result = await storage.increment('blocked-key', 60_000, 5, 300_000, 'auth')

      // Assert
      expect(result).toEqual({
        totalHits: 6, // limit + 1
        timeToExpire: 120_000,
        isBlocked: true,
        timeToBlockExpire: 120_000,
      })
      // Should not call pipeline since we short-circuit on block check
      expect(mockPipelineExec).not.toHaveBeenCalled()
    })
  })

  describe('fail strategy', () => {
    it('should fail open for global tier when Redis is unavailable', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockRejectedValue(new Error('Connection refused'))

      // Act
      const result = await storage.increment('key', 60_000, 60, 0, 'global')

      // Assert -- returns zeros, does not throw
      expect(result).toEqual({
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      })
    })

    it('should fail closed for auth tier when Redis is unavailable', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockRejectedValue(new Error('Connection refused'))

      // Act + Assert -- throws ServiceUnavailableException
      await expect(storage.increment('key', 60_000, 5, 300_000, 'auth')).rejects.toThrow(
        ServiceUnavailableException
      )
    })

    it('should include descriptive message in ServiceUnavailableException', async () => {
      // Arrange
      const storage = createStorage()
      mockTtl.mockRejectedValue(new Error('Connection timeout'))

      // Act + Assert
      await expect(storage.increment('key', 60_000, 5, 300_000, 'auth')).rejects.toThrow(
        'Rate limiting service temporarily unavailable'
      )
    })
  })
})
