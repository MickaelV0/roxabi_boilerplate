import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GdprController } from './gdpr.controller.js'
import type { GdprService } from './gdpr.service.js'

const mockGdprService = {
  exportUserData: vi.fn(),
} as unknown as GdprService

const mockExportData = {
  exportedAt: '2026-02-17T12:00:00.000Z',
  user: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    image: 'https://example.com/avatar.png',
    role: 'user',
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  sessions: [
    {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  accounts: [
    {
      providerId: 'google',
      scope: 'openid email profile',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  organizations: [
    {
      name: 'Test Org',
      role: 'member',
      joinedAt: '2026-01-15T00:00:00.000Z',
    },
  ],
  invitations: [],
  consent: [
    {
      categories: { necessary: true, analytics: false, marketing: false },
      action: 'rejected',
      consentedAt: '2026-02-17T12:00:00.000Z',
      policyVersion: '2026-02-v1',
    },
  ],
}

describe('GdprController', () => {
  const controller = new GdprController(mockGdprService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportUserData (GET /api/gdpr/export)', () => {
    it('should call gdprService.exportUserData with the authenticated user id', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const reply = { header: vi.fn().mockReturnThis() }
      vi.mocked(mockGdprService.exportUserData).mockResolvedValue(mockExportData)

      // Act
      await controller.exportUserData(session, reply as never)

      // Assert
      expect(mockGdprService.exportUserData).toHaveBeenCalledWith('user-1')
    })

    it('should set Content-Disposition header for JSON file download', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const reply = { header: vi.fn().mockReturnThis() }
      vi.mocked(mockGdprService.exportUserData).mockResolvedValue(mockExportData)

      // Act
      await controller.exportUserData(session, reply as never)

      // Assert
      expect(reply.header).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/attachment; filename="roxabi-data-export-\d{4}-\d{2}-\d{2}\.json"/)
      )
    })

    it('should return export data with correct structure', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const reply = { header: vi.fn().mockReturnThis() }
      vi.mocked(mockGdprService.exportUserData).mockResolvedValue(mockExportData)

      // Act
      const result = await controller.exportUserData(session, reply as never)

      // Assert
      expect(result).toHaveProperty('exportedAt')
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('sessions')
      expect(result).toHaveProperty('accounts')
      expect(result).toHaveProperty('organizations')
      expect(result).toHaveProperty('invitations')
      expect(result).toHaveProperty('consent')
    })

    it('should exclude sensitive fields from the export response', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const reply = { header: vi.fn().mockReturnThis() }
      vi.mocked(mockGdprService.exportUserData).mockResolvedValue(mockExportData)

      // Act
      const result = await controller.exportUserData(session, reply as never)

      // Assert
      const resultStr = JSON.stringify(result)
      expect(resultStr).not.toContain('accessToken')
      expect(resultStr).not.toContain('refreshToken')
      expect(resultStr).not.toContain('idToken')
      expect(resultStr).not.toContain('"password"')
      expect(resultStr).not.toContain('"token"')
    })
  })
})
