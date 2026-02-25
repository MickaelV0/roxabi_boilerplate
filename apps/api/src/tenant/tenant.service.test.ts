import { describe, expect, it, vi } from 'vitest'
import { DatabaseUnavailableException } from './exceptions/databaseUnavailable.exception.js'
import { TenantContextMissingException } from './exceptions/tenantContextMissing.exception.js'
import { TenantService } from './tenant.service.js'

function createMockCls(tenantId: string | null = null) {
  return {
    get: vi.fn().mockReturnValue(tenantId),
    set: vi.fn(),
  }
}

function createMockDb() {
  const executeFn = vi.fn().mockResolvedValue(undefined)
  const txProxy = new Proxy(
    { execute: executeFn },
    {
      get(target, prop) {
        if (prop in target) return target[prop as keyof typeof target]
        return vi.fn()
      },
    }
  )

  return {
    transaction: vi.fn(async (callback: (tx: typeof txProxy) => Promise<unknown>) => {
      return callback(txProxy)
    }),
    _txProxy: txProxy,
    _executeFn: executeFn,
  }
}

describe('TenantService', () => {
  describe('query()', () => {
    it('should execute callback within a tenant-scoped transaction', async () => {
      // Arrange
      const cls = createMockCls('org-1')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      const callback = vi.fn().mockResolvedValue('result')

      // Act
      const result = await service.query(callback)

      // Assert
      expect(result).toBe('result')
      expect(db.transaction).toHaveBeenCalled()
      expect(db._executeFn).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledOnce()
    })

    it('should read tenantId from CLS using the "tenantId" key', async () => {
      // Arrange
      const cls = createMockCls('org-42')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)

      // Act
      await service.query(vi.fn().mockResolvedValue(undefined))

      // Assert
      expect(cls.get).toHaveBeenCalledWith('tenantId')
    })

    it('should throw TenantContextMissingException when tenantId is null in CLS', async () => {
      // Arrange
      const cls = createMockCls(null)
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)

      // Act & Assert
      await expect(service.query(vi.fn())).rejects.toThrow(TenantContextMissingException)
    })

    it('should throw TenantContextMissingException with descriptive message when no tenant context', async () => {
      // Arrange
      const cls = createMockCls(null)
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)

      // Act & Assert
      await expect(service.query(vi.fn())).rejects.toThrow('No tenant context available')
    })

    it('should not call db.transaction when tenantId is missing', async () => {
      // Arrange
      const cls = createMockCls(null)
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)

      // Act
      try {
        await service.query(vi.fn())
      } catch {
        // expected
      }

      // Assert
      expect(db.transaction).not.toHaveBeenCalled()
    })
  })

  describe('queryAs()', () => {
    it('should use explicit tenantId without reading from CLS', async () => {
      // Arrange
      const cls = createMockCls('cls-org-should-not-be-used')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      const callback = vi.fn().mockResolvedValue('result')

      // Act
      const result = await service.queryAs('explicit-org-id', callback)

      // Assert
      expect(result).toBe('result')
      expect(cls.get).not.toHaveBeenCalled()
    })

    it('should succeed even when CLS has no tenant context', async () => {
      // Arrange
      const cls = createMockCls(null)
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      const callback = vi.fn().mockResolvedValue('explicit-result')

      // Act
      const result = await service.queryAs('explicit-org-id', callback)

      // Assert
      expect(result).toBe('explicit-result')
      expect(db.transaction).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledOnce()
    })

    it('should pass the explicit tenantId to set_config SQL', async () => {
      // Arrange
      const cls = createMockCls(null)
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      const callback = vi.fn().mockResolvedValue(undefined)

      // Act
      await service.queryAs('explicit-tenant-99', callback)

      // Assert — the SQL queryChunks contain the tenant ID as a plain string
      // First call is SET LOCAL ROLE, second is set_config
      const sqlArg = db._executeFn.mock.calls[1]?.[0]
      const stringChunks = sqlArg.queryChunks.filter((chunk: unknown) => typeof chunk === 'string')
      expect(stringChunks).toContain('explicit-tenant-99')
    })
  })

  describe('set_config SQL', () => {
    it('should call set_config with the correct tenant ID from CLS', async () => {
      // Arrange
      const cls = createMockCls('tenant-abc-123')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)

      // Act
      await service.query(vi.fn().mockResolvedValue(undefined))

      // Assert — first call is SET LOCAL ROLE, second is set_config
      expect(db._executeFn).toHaveBeenCalledTimes(2)
      const sqlArg = db._executeFn.mock.calls[1]?.[0]
      const stringChunks = sqlArg.queryChunks.filter((chunk: unknown) => typeof chunk === 'string')
      expect(stringChunks).toContain('tenant-abc-123')
    })

    it('should call SET LOCAL ROLE app_user before set_config', async () => {
      // Arrange
      const cls = createMockCls('org-1')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)

      // Act
      await service.query(vi.fn().mockResolvedValue(undefined))

      // Assert — first call is SET LOCAL ROLE, second is set_config
      expect(db._executeFn).toHaveBeenCalledTimes(2)
      const roleCall = db._executeFn.mock.calls[0]?.[0]
      // drizzle-orm sql`` wraps template parts in StringChunk objects with a .value string[]
      const chunkValues = roleCall.queryChunks
        .filter((chunk: unknown) => typeof chunk === 'object' && chunk !== null && 'value' in chunk)
        .flatMap((chunk: { value: string[] }) => chunk.value)
      expect(chunkValues.some((s: string) => s.includes('SET LOCAL ROLE app_user'))).toBe(true)
    })

    it('should call set_config before executing the callback', async () => {
      // Arrange
      const callOrder: string[] = []
      const cls = createMockCls('org-1')
      const db = createMockDb()
      db._executeFn.mockImplementation(
        async (sqlObj: { queryChunks: Array<{ value?: string[] } | unknown> }) => {
          // Extract text from StringChunk objects (.value string[]) and plain strings
          const allText = sqlObj.queryChunks
            .filter(
              (chunk: unknown) => typeof chunk === 'object' && chunk !== null && 'value' in chunk
            )
            .flatMap((chunk) => (chunk as { value: string[] }).value)
          if (allText.some((s: string) => s.includes('SET LOCAL ROLE'))) {
            callOrder.push('set_role')
          } else {
            callOrder.push('set_config')
          }
        }
      )
      const service = new TenantService(cls as never, db as never)
      const callback = vi.fn().mockImplementation(async () => {
        callOrder.push('callback')
        return 'done'
      })

      // Act
      await service.query(callback)

      // Assert
      expect(callOrder).toEqual(['set_role', 'set_config', 'callback'])
    })
  })

  describe('transaction proxy', () => {
    it('should pass the transaction proxy to the callback', async () => {
      // Arrange
      const cls = createMockCls('org-1')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      let receivedTx: unknown = null

      // Act
      await service.query(async (tx) => {
        receivedTx = tx
        return 'ok'
      })

      // Assert — verify identity with the proxy object
      expect(receivedTx).toBe(db._txProxy)
    })

    it('should pass the same transaction proxy for queryAs()', async () => {
      // Arrange
      const cls = createMockCls(null)
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      let receivedTx: unknown = null

      // Act
      await service.queryAs('org-1', async (tx) => {
        receivedTx = tx
        return 'ok'
      })

      // Assert — verify identity with the proxy object
      expect(receivedTx).toBe(db._txProxy)
    })
  })

  describe('error propagation', () => {
    it('should propagate errors thrown by the callback', async () => {
      // Arrange
      const cls = createMockCls('org-1')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      const callbackError = new Error('Something went wrong in callback')

      // Act & Assert
      await expect(
        service.query(async () => {
          throw callbackError
        })
      ).rejects.toThrow('Something went wrong in callback')
    })

    it('should propagate the exact error instance from the callback', async () => {
      // Arrange
      const cls = createMockCls('org-1')
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      const callbackError = new Error('Specific error')

      // Act & Assert
      await expect(
        service.query(async () => {
          throw callbackError
        })
      ).rejects.toBe(callbackError)
    })

    it('should propagate errors from queryAs() callback', async () => {
      // Arrange
      const cls = createMockCls(null)
      const db = createMockDb()
      const service = new TenantService(cls as never, db as never)
      const callbackError = new Error('queryAs callback failure')

      // Act & Assert
      await expect(
        service.queryAs('org-1', async () => {
          throw callbackError
        })
      ).rejects.toBe(callbackError)
    })

    it('should propagate errors when set_config execution fails', async () => {
      // Arrange
      const cls = createMockCls('org-1')
      const db = createMockDb()
      db._executeFn.mockRejectedValue(new Error('set_config failed'))
      const service = new TenantService(cls as never, db as never)

      // Act & Assert
      await expect(service.query(vi.fn().mockResolvedValue('should not reach'))).rejects.toThrow(
        'set_config failed'
      )
    })
  })

  describe('database not available', () => {
    it('should throw DatabaseUnavailableException when database is null via query()', async () => {
      // Arrange
      const cls = createMockCls('org-1')
      const service = new TenantService(cls as never, null)

      // Act & Assert
      await expect(service.query(vi.fn())).rejects.toThrow(DatabaseUnavailableException)
    })

    it('should throw DatabaseUnavailableException when database is null via queryAs()', async () => {
      // Arrange
      const cls = createMockCls(null)
      const service = new TenantService(cls as never, null)

      // Act & Assert
      await expect(service.queryAs('org-1', vi.fn())).rejects.toThrow(DatabaseUnavailableException)
    })
  })
})
