import { UnauthorizedException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PurgeController } from './purge.controller.js'
import type { PurgeService } from './purge.service.js'

const mockPurgeService: PurgeService = {
  runPurge: vi.fn(),
} as unknown as PurgeService

describe('PurgeController', () => {
  const controller = new PurgeController(mockPurgeService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('purge', () => {
    it('should call purgeService.runPurge when cron secret is valid', async () => {
      // Arrange
      vi.stubEnv('CRON_SECRET', 'my-secret')
      const purgeResult = { usersAnonymized: 2, orgsAnonymized: 1 }
      vi.mocked(mockPurgeService.runPurge).mockResolvedValue(purgeResult)

      // Act
      const result = await controller.purge('Bearer my-secret')

      // Assert
      expect(result).toEqual(purgeResult)
      expect(mockPurgeService.runPurge).toHaveBeenCalledOnce()

      vi.unstubAllEnvs()
    })

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      // Arrange
      vi.stubEnv('CRON_SECRET', 'my-secret')

      // Act & Assert
      await expect(controller.purge(undefined)).rejects.toThrow(UnauthorizedException)

      vi.unstubAllEnvs()
    })

    it('should throw UnauthorizedException when token does not match cron secret', async () => {
      // Arrange
      vi.stubEnv('CRON_SECRET', 'my-secret')

      // Act & Assert
      await expect(controller.purge('Bearer wrong-secret')).rejects.toThrow(UnauthorizedException)

      vi.unstubAllEnvs()
    })

    it('should throw UnauthorizedException when CRON_SECRET is not set', async () => {
      // Arrange
      delete process.env.CRON_SECRET

      // Act & Assert
      await expect(controller.purge('Bearer any-token')).rejects.toThrow(UnauthorizedException)
    })
  })
})
