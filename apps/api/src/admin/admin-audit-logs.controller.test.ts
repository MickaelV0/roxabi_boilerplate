import { BadRequestException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAuditLogsController } from './admin-audit-logs.controller.js'
import type { AdminAuditLogsService } from './admin-audit-logs.service.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockAdminAuditLogsService: AdminAuditLogsService = {
  listAuditLogs: vi.fn(),
  redactSensitiveFields: vi.fn(),
} as unknown as AdminAuditLogsService

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminAuditLogsController', () => {
  const controller = new AdminAuditLogsController(mockAdminAuditLogsService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // -----------------------------------------------------------------------
  // Decorator verification
  // -----------------------------------------------------------------------
  it('should use @Roles(superadmin) and @SkipOrg() on the controller class', () => {
    // Arrange
    const reflector = new Reflector()

    // Act
    const roles = reflector.get('ROLES', AdminAuditLogsController)
    const skipOrg = reflector.get('SKIP_ORG', AdminAuditLogsController)

    // Assert
    expect(roles).toEqual(['superadmin'])
    expect(skipOrg).toBe(true)
  })

  // -----------------------------------------------------------------------
  // GET /api/admin/audit-logs
  // -----------------------------------------------------------------------
  describe('GET /api/admin/audit-logs', () => {
    it('should delegate to service.listAuditLogs with default pagination and empty filters', async () => {
      // Arrange
      const expected = { data: [], cursor: { next: null, hasMore: false } }
      vi.mocked(mockAdminAuditLogsService.listAuditLogs).mockResolvedValue(expected)

      // Act
      const result = await controller.listAuditLogs()

      // Assert
      expect(result).toEqual(expected)
      expect(mockAdminAuditLogsService.listAuditLogs).toHaveBeenCalledWith(
        {
          from: undefined,
          to: undefined,
          actorId: undefined,
          action: undefined,
          resource: undefined,
          organizationId: undefined,
          search: undefined,
        },
        undefined,
        20
      )
    })

    it('should pass all valid filter params to service', async () => {
      // Arrange
      vi.mocked(mockAdminAuditLogsService.listAuditLogs).mockResolvedValue({
        data: [],
        cursor: { next: null, hasMore: false },
      })
      const actorId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
      const organizationId = 'f1e2d3c4-b5a6-4a7b-8c9d-0e1f2a3b4c5d'

      // Act
      await controller.listAuditLogs(
        'cursor-abc',
        '10',
        '2025-01-01T00:00:00.000Z',
        '2025-12-31T23:59:59.000Z',
        actorId,
        'user.updated',
        'user',
        organizationId,
        'alice'
      )

      // Assert
      expect(mockAdminAuditLogsService.listAuditLogs).toHaveBeenCalledWith(
        {
          from: new Date('2025-01-01T00:00:00.000Z'),
          to: new Date('2025-12-31T23:59:59.000Z'),
          actorId,
          action: 'user.updated',
          resource: 'user',
          organizationId,
          search: 'alice',
        },
        'cursor-abc',
        10
      )
    })

    it('should throw BadRequestException when limit exceeds 100', async () => {
      // Act & Assert
      await expect(controller.listAuditLogs(undefined, '500')).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when limit is negative', async () => {
      // Act & Assert
      await expect(controller.listAuditLogs(undefined, '-5')).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when limit is not a number', async () => {
      // Act & Assert
      await expect(controller.listAuditLogs(undefined, 'not-a-number')).rejects.toThrow(
        BadRequestException
      )
    })

    it('should throw BadRequestException when actorId is not a valid UUID', async () => {
      // Act & Assert
      await expect(
        controller.listAuditLogs(undefined, undefined, undefined, undefined, 'not-a-uuid')
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when organizationId is not a valid UUID', async () => {
      // Act & Assert
      await expect(
        controller.listAuditLogs(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'not-a-uuid'
        )
      ).rejects.toThrow(BadRequestException)
    })

    it('should accept valid limit within range [1, 100]', async () => {
      // Arrange
      vi.mocked(mockAdminAuditLogsService.listAuditLogs).mockResolvedValue({
        data: [],
        cursor: { next: null, hasMore: false },
      })

      // Act
      await controller.listAuditLogs(undefined, '50')

      // Assert
      expect(mockAdminAuditLogsService.listAuditLogs).toHaveBeenCalledWith(
        expect.anything(),
        undefined,
        50
      )
    })

    it('should convert from/to strings to Date objects', async () => {
      // Arrange
      vi.mocked(mockAdminAuditLogsService.listAuditLogs).mockResolvedValue({
        data: [],
        cursor: { next: null, hasMore: false },
      })

      // Act
      await controller.listAuditLogs(
        undefined,
        undefined,
        '2025-06-01T00:00:00.000Z',
        '2025-06-30T23:59:59.000Z'
      )

      // Assert
      expect(mockAdminAuditLogsService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          from: new Date('2025-06-01T00:00:00.000Z'),
          to: new Date('2025-06-30T23:59:59.000Z'),
        }),
        undefined,
        20
      )
    })

    it('should not convert from/to when not provided', async () => {
      // Arrange
      vi.mocked(mockAdminAuditLogsService.listAuditLogs).mockResolvedValue({
        data: [],
        cursor: { next: null, hasMore: false },
      })

      // Act
      await controller.listAuditLogs()

      // Assert
      expect(mockAdminAuditLogsService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          from: undefined,
          to: undefined,
        }),
        undefined,
        20
      )
    })

    it('should trim search whitespace', async () => {
      // Arrange
      vi.mocked(mockAdminAuditLogsService.listAuditLogs).mockResolvedValue({
        data: [],
        cursor: { next: null, hasMore: false },
      })

      // Act
      await controller.listAuditLogs(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '  user.created  '
      )

      // Assert
      expect(mockAdminAuditLogsService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'user.created' }),
        undefined,
        20
      )
    })

    it('should pass empty string filter values as undefined', async () => {
      // Arrange
      vi.mocked(mockAdminAuditLogsService.listAuditLogs).mockResolvedValue({
        data: [],
        cursor: { next: null, hasMore: false },
      })

      // Act
      await controller.listAuditLogs(undefined, undefined, undefined, undefined, '', '', '', '', '')

      // Assert
      expect(mockAdminAuditLogsService.listAuditLogs).toHaveBeenCalledWith(
        {
          from: undefined,
          to: undefined,
          actorId: undefined,
          action: undefined,
          resource: undefined,
          organizationId: undefined,
          search: undefined,
        },
        undefined,
        20
      )
    })
  })
})
