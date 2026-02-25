import { describe, expect, it, vi } from 'vitest'
import { SystemSettingsService } from './systemSettings.service.js'

// Drizzle builder chain shapes used by SystemSettingsService:
//   getValue:      select().from().where().limit() → returns array
//   getAll:        select().from()                → returns array
//   getByCategory: select().from().where()        → returns array

function createMockDb() {
  // Default chain — callers override the terminal fn per test
  const limitFn = vi.fn().mockResolvedValue([])
  const whereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: whereFn })
  const selectFn = vi.fn().mockReturnValue({ from: fromFn })

  return {
    select: selectFn,
    _limitFn: limitFn,
    _whereFn: whereFn,
    _fromFn: fromFn,
  }
}

describe('SystemSettingsService', () => {
  describe('getValue()', () => {
    it('should return the typed value when the setting exists', async () => {
      // Arrange
      const db = createMockDb()
      db._limitFn.mockResolvedValue([{ key: 'app.name', value: 'Roxabi', category: 'General' }])
      const service = new SystemSettingsService(db as never)

      // Act
      const result = await service.getValue<string>('app.name')

      // Assert
      expect(result).toBe('Roxabi')
    })

    it('should return null when the setting does not exist', async () => {
      // Arrange
      const db = createMockDb()
      db._limitFn.mockResolvedValue([])
      const service = new SystemSettingsService(db as never)

      // Act
      const result = await service.getValue('nonexistent')

      // Assert
      expect(result).toBeNull()
    })

    it('should query by the provided key', async () => {
      // Arrange
      const db = createMockDb()
      db._limitFn.mockResolvedValue([{ key: 'app.name', value: 'Roxabi', category: 'General' }])
      const service = new SystemSettingsService(db as never)

      // Act
      await service.getValue('app.name')

      // Assert — where() should receive an expression built from the key
      expect(db._whereFn).toHaveBeenCalledOnce()
    })
  })

  describe('getAll()', () => {
    it('should return all settings from the database', async () => {
      // Arrange
      const mockSettings = [
        { key: 'app.name', value: 'Roxabi', category: 'General' },
        { key: 'app.support_email', value: 'support@roxabi.com', category: 'General' },
        { key: 'email.from_name', value: 'Roxabi Team', category: 'Email' },
      ]
      const fromFn = vi.fn().mockResolvedValue(mockSettings)
      const db = {
        select: vi.fn().mockReturnValue({ from: fromFn }),
      }
      const service = new SystemSettingsService(db as never)

      // Act
      const result = await service.getAll()

      // Assert
      expect(result).toEqual(mockSettings)
      expect(result).toHaveLength(3)
    })

    it('should return an empty array when no settings exist', async () => {
      // Arrange
      const fromFn = vi.fn().mockResolvedValue([])
      const db = {
        select: vi.fn().mockReturnValue({ from: fromFn }),
      }
      const service = new SystemSettingsService(db as never)

      // Act
      const result = await service.getAll()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getByCategory()', () => {
    it('should return only settings belonging to the given category', async () => {
      // Arrange
      const generalSettings = [
        { key: 'app.name', value: 'Roxabi', category: 'General' },
        { key: 'app.support_email', value: 'support@roxabi.com', category: 'General' },
      ]
      const db = createMockDb()
      // getByCategory uses select().from().where() — resolve where() directly
      db._whereFn.mockResolvedValue(generalSettings)
      const service = new SystemSettingsService(db as never)

      // Act
      const result = await service.getByCategory('General')

      // Assert
      expect(result).toEqual(generalSettings)
      expect(result).toHaveLength(2)
    })

    it('should return an empty array when no settings match the category', async () => {
      // Arrange
      const db = createMockDb()
      db._whereFn.mockResolvedValue([])
      const service = new SystemSettingsService(db as never)

      // Act
      const result = await service.getByCategory('Unknown')

      // Assert
      expect(result).toEqual([])
    })

    it('should filter by the provided category value', async () => {
      // Arrange
      const db = createMockDb()
      db._whereFn.mockResolvedValue([])
      const service = new SystemSettingsService(db as never)

      // Act
      await service.getByCategory('Email')

      // Assert — where() should have been called with a category expression
      expect(db._whereFn).toHaveBeenCalledOnce()
    })
  })
})
