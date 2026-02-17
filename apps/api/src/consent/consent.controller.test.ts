import type { ConsentRecord } from '@repo/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsentController } from './consent.controller.js'
import type { ConsentService } from './consent.service.js'
import { ConsentNotFoundException } from './exceptions/consent-not-found.exception.js'

const mockConsentService = {
  saveConsent: vi.fn(),
  getLatestConsent: vi.fn(),
} as unknown as ConsentService

function createMockConfig(values: Record<string, string | undefined> = {}) {
  return {
    get: vi.fn((key: string) => values[key]),
  }
}

const mockConsentRecord: ConsentRecord = {
  id: 'consent-1',
  userId: 'user-1',
  categories: { necessary: true, analytics: true, marketing: false },
  policyVersion: '2026-02-v1',
  action: 'customized',
  createdAt: '2026-02-17T12:00:00.000Z',
  updatedAt: '2026-02-17T12:00:00.000Z',
}

describe('ConsentController', () => {
  const config = createMockConfig({ NODE_ENV: 'test' })
  const controller = new ConsentController(mockConsentService, config as never)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveConsent (POST /api/consent)', () => {
    const validBody = {
      categories: { necessary: true as const, analytics: true, marketing: false },
      policyVersion: '2026-02-v1',
      action: 'customized' as const,
    }

    it('should save consent to DB and return record for authenticated user', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const request = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'TestBrowser/1.0' },
      }
      const reply = {
        setCookie: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }
      vi.mocked(mockConsentService.saveConsent).mockResolvedValue(mockConsentRecord)

      // Act
      const result = await controller.saveConsent(
        session,
        validBody,
        request as never,
        reply as never
      )

      // Assert
      expect(mockConsentService.saveConsent).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          categories: validBody.categories,
          policyVersion: validBody.policyVersion,
          action: validBody.action,
        })
      )
      expect(result).toEqual(mockConsentRecord)
    })

    it('should set cookie via setCookie for both authenticated and anonymous users', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const request = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'TestBrowser/1.0' },
      }
      const reply = {
        setCookie: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }
      vi.mocked(mockConsentService.saveConsent).mockResolvedValue(mockConsentRecord)

      // Act
      await controller.saveConsent(session, validBody, request as never, reply as never)

      // Assert — setCookie should be called with consent cookie name and options
      expect(reply.setCookie).toHaveBeenCalledWith(
        'consent',
        expect.any(String),
        expect.objectContaining({
          path: '/',
          sameSite: 'lax',
          httpOnly: false,
        })
      )
    })

    it('should return 204 and skip DB write for anonymous user', async () => {
      // Arrange
      const session = null
      const request = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'TestBrowser/1.0' },
      }
      const reply = {
        setCookie: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }

      // Act
      const result = await controller.saveConsent(
        session,
        validBody,
        request as never,
        reply as never
      )

      // Assert — anonymous users should not trigger DB write
      expect(mockConsentService.saveConsent).not.toHaveBeenCalled()
      expect(reply.status).toHaveBeenCalledWith(204)
      expect(result).toBeUndefined()
    })

    it('should pass ipAddress and userAgent from request for audit trail', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      const request = {
        ip: '10.0.0.1',
        headers: { 'user-agent': 'AuditBot/2.0' },
      }
      const reply = {
        setCookie: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }
      vi.mocked(mockConsentService.saveConsent).mockResolvedValue(mockConsentRecord)

      // Act
      await controller.saveConsent(session, validBody, request as never, reply as never)

      // Assert
      expect(mockConsentService.saveConsent).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          ipAddress: '10.0.0.1',
          userAgent: 'AuditBot/2.0',
        })
      )
    })

    it('should set secure: false in cookie when not in production', async () => {
      // Arrange
      const testConfig = createMockConfig({ NODE_ENV: 'test' })
      const testController = new ConsentController(mockConsentService, testConfig as never)
      const session = { user: { id: 'user-1' } }
      const request = { ip: '127.0.0.1', headers: {} }
      const reply = {
        setCookie: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }
      vi.mocked(mockConsentService.saveConsent).mockResolvedValue(mockConsentRecord)

      // Act
      await testController.saveConsent(session, validBody, request as never, reply as never)

      // Assert
      expect(reply.setCookie).toHaveBeenCalledWith(
        'consent',
        expect.any(String),
        expect.objectContaining({ secure: false })
      )
    })

    it('should set secure: true in cookie when in production', async () => {
      // Arrange
      const prodConfig = createMockConfig({ NODE_ENV: 'production' })
      const prodController = new ConsentController(mockConsentService, prodConfig as never)
      const session = { user: { id: 'user-1' } }
      const request = { ip: '127.0.0.1', headers: {} }
      const reply = {
        setCookie: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }
      vi.mocked(mockConsentService.saveConsent).mockResolvedValue(mockConsentRecord)

      // Act
      await prodController.saveConsent(session, validBody, request as never, reply as never)

      // Assert
      expect(reply.setCookie).toHaveBeenCalledWith(
        'consent',
        expect.any(String),
        expect.objectContaining({ secure: true })
      )
    })
  })

  describe('getConsent (GET /api/consent)', () => {
    it('should return the latest consent record for authenticated user', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      vi.mocked(mockConsentService.getLatestConsent).mockResolvedValue(mockConsentRecord)

      // Act
      const result = await controller.getConsent(session)

      // Assert
      expect(result).toEqual(mockConsentRecord)
      expect(mockConsentService.getLatestConsent).toHaveBeenCalledWith('user-1')
    })

    it('should propagate ConsentNotFoundException when no consent record exists', async () => {
      // Arrange
      const session = { user: { id: 'user-1' } }
      vi.mocked(mockConsentService.getLatestConsent).mockRejectedValue(
        new ConsentNotFoundException('user-1')
      )

      // Act & Assert
      await expect(controller.getConsent(session)).rejects.toThrow(ConsentNotFoundException)
    })
  })
})
