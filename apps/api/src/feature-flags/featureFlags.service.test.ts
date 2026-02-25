import { describe, expect, it, vi } from 'vitest'
import { FeatureFlagService } from './featureFlags.service.js'

// Drizzle builder chain shapes used by FeatureFlagService:
//   isEnabled: select().from().where().limit()    → returns array
//   getAll:    select().from().orderBy()          → returns array
//   create:    insert().values().returning()      → returns array
//   update:    update().set().where().returning() → returns array
//   delete:    delete().where().returning()        → returns array

function createSelectChain(resolved: unknown[]) {
  const limitFn = vi.fn().mockResolvedValue(resolved)
  const whereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: whereFn })
  return {
    chain: { from: fromFn },
    _limitFn: limitFn,
    _whereFn: whereFn,
    _fromFn: fromFn,
  }
}

function createGetAllChain(resolved: unknown[]) {
  const orderByFn = vi.fn().mockResolvedValue(resolved)
  const fromFn = vi.fn().mockReturnValue({ orderBy: orderByFn })
  return {
    chain: { from: fromFn },
    _orderByFn: orderByFn,
  }
}

function createInsertChain(resolved: unknown[]) {
  const returningFn = vi.fn().mockResolvedValue(resolved)
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn })
  return {
    chain: { values: valuesFn },
    _returningFn: returningFn,
    _valuesFn: valuesFn,
  }
}

function createUpdateChain(resolved: unknown[]) {
  const returningFn = vi.fn().mockResolvedValue(resolved)
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn })
  const setFn = vi.fn().mockReturnValue({ where: whereFn })
  return {
    chain: { set: setFn },
    _returningFn: returningFn,
    _whereFn: whereFn,
    _setFn: setFn,
  }
}

function createDeleteChain(resolved: unknown[]) {
  const returningFn = vi.fn().mockResolvedValue(resolved)
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn })
  return {
    chain: { where: whereFn },
    _returningFn: returningFn,
    _whereFn: whereFn,
  }
}

describe('FeatureFlagService', () => {
  describe('isEnabled()', () => {
    it('should return true when the flag exists and is enabled', async () => {
      // Arrange
      const { chain, _limitFn } = createSelectChain([{ key: 'new-dashboard', enabled: true }])
      _limitFn.mockResolvedValue([{ key: 'new-dashboard', enabled: true }])
      const db = { select: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.isEnabled('new-dashboard')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when the flag exists but is disabled', async () => {
      // Arrange
      const { chain, _limitFn } = createSelectChain([{ key: 'new-dashboard', enabled: false }])
      _limitFn.mockResolvedValue([{ key: 'new-dashboard', enabled: false }])
      const db = { select: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.isEnabled('new-dashboard')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when the flag does not exist in the database', async () => {
      // Arrange
      const { chain } = createSelectChain([])
      const db = { select: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.isEnabled('unknown-flag')

      // Assert
      expect(result).toBe(false)
    })

    it('should return cached value on second call within 60s without querying DB again', async () => {
      // Arrange
      const { chain, _limitFn } = createSelectChain([{ key: 'beta-mode', enabled: true }])
      _limitFn.mockResolvedValue([{ key: 'beta-mode', enabled: true }])
      const db = { select: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act — call twice in quick succession
      const first = await service.isEnabled('beta-mode')
      const second = await service.isEnabled('beta-mode')

      // Assert — DB queried only once
      expect(first).toBe(true)
      expect(second).toBe(true)
      expect(db.select).toHaveBeenCalledOnce()
    })

    it('should query the DB again after the 60s cache TTL expires', async () => {
      // Arrange
      const nowSpy = vi.spyOn(Date, 'now')
      const baseTime = 1_700_000_000_000
      nowSpy.mockReturnValue(baseTime)

      const { chain, _limitFn } = createSelectChain([{ key: 'beta-mode', enabled: true }])
      _limitFn.mockResolvedValue([{ key: 'beta-mode', enabled: true }])
      const db = { select: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // First call — populates cache at baseTime
      await service.isEnabled('beta-mode')

      // Advance clock past 60s
      nowSpy.mockReturnValue(baseTime + 61_000)

      // Reset select mock to a fresh chain for the second DB query
      const { chain: chain2, _limitFn: limitFn2 } = createSelectChain([
        { key: 'beta-mode', enabled: false },
      ])
      limitFn2.mockResolvedValue([{ key: 'beta-mode', enabled: false }])
      db.select = vi.fn().mockReturnValue(chain2)

      // Act — second call after expiry
      const result = await service.isEnabled('beta-mode')

      // Assert — fresh DB query, new value returned
      expect(result).toBe(false)
      expect(db.select).toHaveBeenCalledOnce()

      nowSpy.mockRestore()
    })
  })

  describe('cache invalidation', () => {
    it('should clear the cache for a key after update() so next isEnabled() reads from DB', async () => {
      // Arrange
      const { chain: selectChain1, _limitFn: limitFn1 } = createSelectChain([
        { key: 'beta-mode', enabled: true },
      ])
      limitFn1.mockResolvedValue([{ key: 'beta-mode', enabled: true }])

      const { chain: updateChain } = createUpdateChain([
        { id: 'flag-1', key: 'beta-mode', enabled: true },
      ])

      const { chain: selectChain2, _limitFn: limitFn2 } = createSelectChain([
        { key: 'beta-mode', enabled: true },
      ])
      limitFn2.mockResolvedValue([{ key: 'beta-mode', enabled: true }])

      const db = {
        select: vi.fn().mockReturnValueOnce(selectChain1).mockReturnValueOnce(selectChain2),
        update: vi.fn().mockReturnValue(updateChain),
      }
      const service = new FeatureFlagService(db as never)

      // Populate cache
      await service.isEnabled('beta-mode')
      expect(db.select).toHaveBeenCalledOnce()

      // Act — update should clear the cache entry
      await service.update('flag-1', { enabled: true })

      // Call isEnabled again — must hit DB a second time
      await service.isEnabled('beta-mode')

      // Assert
      expect(db.select).toHaveBeenCalledTimes(2)
    })

    it('should clear the cache for a key after delete()', async () => {
      // Arrange
      const { chain: selectChain1, _limitFn: limitFn1 } = createSelectChain([
        { key: 'old-feature', enabled: true },
      ])
      limitFn1.mockResolvedValue([{ key: 'old-feature', enabled: true }])

      const { chain: deleteChain } = createDeleteChain([{ id: 'flag-2', key: 'old-feature' }])

      const { chain: selectChain2, _limitFn: limitFn2 } = createSelectChain([])
      limitFn2.mockResolvedValue([])

      const db = {
        select: vi.fn().mockReturnValueOnce(selectChain1).mockReturnValueOnce(selectChain2),
        delete: vi.fn().mockReturnValue(deleteChain),
      }
      const service = new FeatureFlagService(db as never)

      // Populate cache
      await service.isEnabled('old-feature')
      expect(db.select).toHaveBeenCalledOnce()

      // Act — delete should clear the cache entry
      await service.delete('flag-2')

      // Call isEnabled again — must hit DB a second time
      const result = await service.isEnabled('old-feature')

      // Assert
      expect(db.select).toHaveBeenCalledTimes(2)
      expect(result).toBe(false)
    })
  })

  describe('getAll()', () => {
    it('should return all flags ordered by createdAt DESC', async () => {
      // Arrange
      const mockFlags = [
        {
          id: 'flag-2',
          key: 'beta-mode',
          name: 'Beta Mode',
          enabled: true,
          createdAt: new Date('2024-02-01'),
        },
        {
          id: 'flag-1',
          key: 'new-dashboard',
          name: 'New Dashboard',
          enabled: false,
          createdAt: new Date('2024-01-01'),
        },
      ]
      const { chain } = createGetAllChain(mockFlags)
      const db = { select: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.getAll()

      // Assert
      expect(result).toEqual(mockFlags)
      expect(result).toHaveLength(2)
    })

    it('should return an empty array when no flags exist', async () => {
      // Arrange
      const { chain } = createGetAllChain([])
      const db = { select: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.getAll()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('create()', () => {
    it('should insert a new flag and return the created record', async () => {
      // Arrange
      const newFlag = { id: 'flag-3', key: 'dark-mode', name: 'Dark Mode', enabled: false }
      const { chain, _valuesFn } = createInsertChain([newFlag])
      const db = { insert: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)
      const input = { name: 'Dark Mode', key: 'dark-mode', description: 'Enable dark mode UI' }

      // Act
      const result = await service.create(input)

      // Assert
      expect(result).toEqual(newFlag)
      expect(db.insert).toHaveBeenCalledOnce()
      expect(_valuesFn).toHaveBeenCalledOnce()
    })

    it('should create a flag without an optional description', async () => {
      // Arrange
      const newFlag = { id: 'flag-4', key: 'no-desc', name: 'No Description', enabled: false }
      const { chain } = createInsertChain([newFlag])
      const db = { insert: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.create({ name: 'No Description', key: 'no-desc' })

      // Assert
      expect(result).toEqual(newFlag)
    })
  })

  describe('update()', () => {
    it('should update flag fields and return the updated record', async () => {
      // Arrange
      const updatedFlag = {
        id: 'flag-1',
        key: 'new-dashboard',
        name: 'New Dashboard',
        enabled: true,
      }
      const { chain, _setFn } = createUpdateChain([updatedFlag])
      const db = { update: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.update('flag-1', { enabled: true })

      // Assert
      expect(result).toEqual(updatedFlag)
      expect(db.update).toHaveBeenCalledOnce()
      expect(_setFn).toHaveBeenCalledOnce()
    })

    it('should allow updating only the name', async () => {
      // Arrange
      const updatedFlag = {
        id: 'flag-1',
        key: 'new-dashboard',
        name: 'Renamed Dashboard',
        enabled: false,
      }
      const { chain } = createUpdateChain([updatedFlag])
      const db = { update: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      const result = await service.update('flag-1', { name: 'Renamed Dashboard' })

      // Assert
      expect(result).toEqual(updatedFlag)
    })
  })

  describe('delete()', () => {
    it('should remove the flag from the database', async () => {
      // Arrange
      const { chain, _returningFn } = createDeleteChain([{ id: 'flag-1', key: 'new-dashboard' }])
      const db = { delete: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act
      await service.delete('flag-1')

      // Assert
      expect(db.delete).toHaveBeenCalledOnce()
      expect(_returningFn).toHaveBeenCalledOnce()
    })

    it('should resolve without error even when the flag does not exist', async () => {
      // Arrange
      const { chain } = createDeleteChain([])
      const db = { delete: vi.fn().mockReturnValue(chain) }
      const service = new FeatureFlagService(db as never)

      // Act & Assert — should not throw
      await expect(service.delete('nonexistent-id')).resolves.toBeUndefined()
    })
  })
})
