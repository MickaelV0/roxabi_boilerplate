import { ForbiddenException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
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
    expect(callback).toHaveBeenCalledWith(db._txProxy)
  })

  it('should throw ForbiddenException when tenantId is null', async () => {
    // Arrange
    const cls = createMockCls(null)
    const db = createMockDb()
    const service = new TenantService(cls as never, db as never)

    // Act & Assert
    await expect(service.query(vi.fn())).rejects.toThrow(ForbiddenException)
  })

  it('should use explicit tenantId with queryAs()', async () => {
    // Arrange
    const cls = createMockCls(null) // CLS has no tenant
    const db = createMockDb()
    const service = new TenantService(cls as never, db as never)
    const callback = vi.fn().mockResolvedValue('result')

    // Act
    const result = await service.queryAs('explicit-org-id', callback)

    // Assert
    expect(result).toBe('result')
    expect(db.transaction).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(db._txProxy)
  })

  it('should throw Error when database is not available', async () => {
    // Arrange
    const cls = createMockCls('org-1')
    const service = new TenantService(cls as never, null)

    // Act & Assert
    await expect(service.query(vi.fn())).rejects.toThrow('Database not available')
  })

  // TODO: test that set_config SQL is called with correct tenant ID
  // TODO: test transaction rollback behavior
})
