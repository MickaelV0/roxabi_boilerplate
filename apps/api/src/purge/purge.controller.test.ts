import { UnauthorizedException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PurgeController } from './purge.controller.js'
import type { PurgeService } from './purge.service.js'

const mockPurgeService: PurgeService = {
  runPurge: vi.fn(),
} as unknown as PurgeService

function createMockConfigService(cronSecret?: string) {
  return {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'CRON_SECRET') return cronSecret
      return undefined
    }),
  } as unknown as ConfigService
}

describe('PurgeController', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('purge', () => {
    it('should call purgeService.runPurge when cron secret is valid', async () => {
      // Arrange
      const configService = createMockConfigService('my-secret')
      const controller = new PurgeController(mockPurgeService, configService)
      const purgeResult = { usersAnonymized: 2, orgsAnonymized: 1 }
      vi.mocked(mockPurgeService.runPurge).mockResolvedValue(purgeResult)

      // Act
      const result = await controller.purge('Bearer my-secret')

      // Assert
      expect(result).toEqual(purgeResult)
      expect(mockPurgeService.runPurge).toHaveBeenCalledOnce()
    })

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      // Arrange
      const configService = createMockConfigService('my-secret')
      const controller = new PurgeController(mockPurgeService, configService)

      // Act & Assert
      await expect(controller.purge(undefined)).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when token does not match cron secret', async () => {
      // Arrange
      const configService = createMockConfigService('my-secret')
      const controller = new PurgeController(mockPurgeService, configService)

      // Act & Assert
      await expect(controller.purge('Bearer wrong-secret')).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when CRON_SECRET is not set', async () => {
      // Arrange
      const configService = createMockConfigService(undefined)
      const controller = new PurgeController(mockPurgeService, configService)

      // Act & Assert
      await expect(controller.purge('Bearer any-token')).rejects.toThrow(UnauthorizedException)
    })
  })
})
