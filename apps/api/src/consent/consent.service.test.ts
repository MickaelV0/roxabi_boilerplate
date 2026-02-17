import { describe, expect, it, vi } from 'vitest'
import { ConsentService, type SaveConsentDto } from './consent.service.js'

const mockConsentRow = {
  id: 'consent-1',
  userId: 'user-1',
  categories: { necessary: true, analytics: true, marketing: false },
  policyVersion: '2026-02-v1',
  action: 'customized',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  createdAt: new Date('2026-02-17T12:00:00Z'),
  updatedAt: new Date('2026-02-17T12:00:00Z'),
}

function createMockDb() {
  const returningFn = vi.fn()
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn })
  const insertFn = vi.fn().mockReturnValue({ values: valuesFn })

  const limitFn = vi.fn()
  const orderByFn = vi.fn().mockReturnValue({ limit: limitFn })
  const whereFn = vi.fn().mockReturnValue({ orderBy: orderByFn })
  const fromFn = vi.fn().mockReturnValue({ where: whereFn })
  const selectFn = vi.fn().mockReturnValue({ from: fromFn })

  return {
    db: { insert: insertFn, select: selectFn },
    chains: {
      insert: { values: valuesFn, returning: returningFn },
      select: { from: fromFn, where: whereFn, orderBy: orderByFn, limit: limitFn },
    },
  }
}

describe('ConsentService', () => {
  describe('saveConsent', () => {
    it('should insert a consent record and return the mapped result', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([mockConsentRow])
      const service = new ConsentService(db as never)

      const dto: SaveConsentDto = {
        categories: { necessary: true, analytics: true, marketing: false },
        policyVersion: '2026-02-v1',
        action: 'customized',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      // Act
      const result = await service.saveConsent('user-1', dto)

      // Assert
      expect(db.insert).toHaveBeenCalled()
      expect(chains.insert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          categories: { necessary: true, analytics: true, marketing: false },
          policyVersion: '2026-02-v1',
          action: 'customized',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        })
      )
      expect(result).toEqual({
        id: 'consent-1',
        userId: 'user-1',
        categories: { necessary: true, analytics: true, marketing: false },
        policyVersion: '2026-02-v1',
        action: 'customized',
        createdAt: '2026-02-17T12:00:00.000Z',
        updatedAt: '2026-02-17T12:00:00.000Z',
      })
    })

    it('should store ipAddress and userAgent in the record', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([mockConsentRow])
      const service = new ConsentService(db as never)

      const dto: SaveConsentDto = {
        categories: { necessary: true, analytics: false, marketing: false },
        policyVersion: '2026-02-v1',
        action: 'rejected',
        ipAddress: '10.0.0.1',
        userAgent: 'TestAgent/1.0',
      }

      // Act
      await service.saveConsent('user-1', dto)

      // Assert
      expect(chains.insert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '10.0.0.1',
          userAgent: 'TestAgent/1.0',
        })
      )
    })

    it('should set ipAddress and userAgent to null when not provided', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        { ...mockConsentRow, ipAddress: null, userAgent: null },
      ])
      const service = new ConsentService(db as never)

      const dto: SaveConsentDto = {
        categories: { necessary: true, analytics: false, marketing: false },
        policyVersion: '2026-02-v1',
        action: 'rejected',
      }

      // Act
      await service.saveConsent('user-1', dto)

      // Assert
      expect(chains.insert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        })
      )
    })
  })

  describe('getLatestConsent', () => {
    it('should return the most recent consent record for a user', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([mockConsentRow])
      const service = new ConsentService(db as never)

      // Act
      const result = await service.getLatestConsent('user-1')

      // Assert
      expect(result).toEqual({
        id: 'consent-1',
        userId: 'user-1',
        categories: { necessary: true, analytics: true, marketing: false },
        policyVersion: '2026-02-v1',
        action: 'customized',
        createdAt: '2026-02-17T12:00:00.000Z',
        updatedAt: '2026-02-17T12:00:00.000Z',
      })
      expect(chains.select.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when no consent record exists for the user', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([])
      const service = new ConsentService(db as never)

      // Act
      const result = await service.getLatestConsent('nonexistent-user')

      // Assert
      expect(result).toBeNull()
    })
  })
})
