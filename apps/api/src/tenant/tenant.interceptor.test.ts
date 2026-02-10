import { lastValueFrom, of } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TenantInterceptor } from './tenant.interceptor.js'

function createMockCls(store: Record<string, unknown> = {}) {
  return {
    set: vi.fn((key: string, value: unknown) => {
      store[key] = value
    }),
    get: vi.fn((key: string) => store[key]),
  }
}

function createMockContext(session: Record<string, unknown> | null = null) {
  const request = { session }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: vi.fn(),
    getClass: vi.fn(),
  }
}

function createMockCallHandler(returnValue = 'handler-result') {
  const handle = vi.fn().mockReturnValue(of(returnValue))
  return { handle }
}

function createMockDb(rows: Record<string, unknown>[] = []) {
  const limitFn = vi.fn().mockResolvedValue(rows)
  const whereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: whereFn })
  const selectFn = vi.fn().mockReturnValue({ from: fromFn })
  return {
    select: selectFn,
    _mocks: { selectFn, fromFn, whereFn, limitFn },
  }
}

describe('TenantInterceptor', () => {
  let store: Record<string, unknown>

  beforeEach(() => {
    store = {}
  })

  it('should set tenantId to null when no session exists', async () => {
    // Arrange
    const cls = createMockCls(store)
    const interceptor = new TenantInterceptor(cls as never, null)
    const context = createMockContext(null)
    const next = createMockCallHandler()

    // Act
    const result$ = interceptor.intercept(context as never, next as never)
    await lastValueFrom(result$)

    // Assert
    expect(cls.set).toHaveBeenCalledWith('tenantId', null)
  })

  it('should set tenantId to null when activeOrganizationId is null', async () => {
    // Arrange
    const cls = createMockCls(store)
    const interceptor = new TenantInterceptor(cls as never, null)
    const context = createMockContext({
      session: { activeOrganizationId: null },
    })
    const next = createMockCallHandler()

    // Act
    const result$ = interceptor.intercept(context as never, next as never)
    await lastValueFrom(result$)

    // Assert
    expect(cls.set).toHaveBeenCalledWith('tenantId', null)
  })

  it('should use activeOrganizationId directly when DB is null', async () => {
    // Arrange
    const cls = createMockCls(store)
    const interceptor = new TenantInterceptor(cls as never, null)
    const context = createMockContext({
      session: { activeOrganizationId: 'org-1' },
    })
    const next = createMockCallHandler()

    // Act
    const result$ = interceptor.intercept(context as never, next as never)
    await lastValueFrom(result$)

    // Assert
    expect(cls.set).toHaveBeenCalledWith('tenantId', 'org-1')
  })

  it('should call next.handle() to continue the request pipeline', async () => {
    // Arrange
    const cls = createMockCls(store)
    const interceptor = new TenantInterceptor(cls as never, null)
    const context = createMockContext({
      session: { activeOrganizationId: 'org-1' },
    })
    const next = createMockCallHandler()

    // Act
    const result$ = interceptor.intercept(context as never, next as never)
    await lastValueFrom(result$)

    // Assert
    expect(next.handle).toHaveBeenCalled()
  })

  describe('parent org resolution', () => {
    it('should use org ID as tenantId when org has no parent', async () => {
      // Arrange
      const cls = createMockCls(store)
      const db = createMockDb([{ id: 'org-1', name: 'Root Org' }])
      const interceptor = new TenantInterceptor(cls as never, db as never)
      const context = createMockContext({
        session: { activeOrganizationId: 'org-1' },
      })
      const next = createMockCallHandler()

      // Act
      const result$ = interceptor.intercept(context as never, next as never)
      await lastValueFrom(result$)

      // Assert
      expect(cls.set).toHaveBeenCalledWith('tenantId', 'org-1')
    })

    it('should resolve to parent org ID when org has a parent', async () => {
      // Arrange
      const cls = createMockCls(store)
      const db = createMockDb([
        { id: 'child-org', name: 'Child Org', parentOrganizationId: 'parent-org' },
      ])
      const interceptor = new TenantInterceptor(cls as never, db as never)
      const context = createMockContext({
        session: { activeOrganizationId: 'child-org' },
      })
      const next = createMockCallHandler()

      // Act
      const result$ = interceptor.intercept(context as never, next as never)
      await lastValueFrom(result$)

      // Assert
      expect(cls.set).toHaveBeenCalledWith('tenantId', 'parent-org')
    })

    it('should fall back to activeOrganizationId when org is not found in DB', async () => {
      // Arrange
      const cls = createMockCls(store)
      const db = createMockDb([])
      const interceptor = new TenantInterceptor(cls as never, db as never)
      const context = createMockContext({
        session: { activeOrganizationId: 'missing-org' },
      })
      const next = createMockCallHandler()

      // Act
      const result$ = interceptor.intercept(context as never, next as never)
      await lastValueFrom(result$)

      // Assert
      expect(cls.set).toHaveBeenCalledWith('tenantId', 'missing-org')
    })

    it('should fall back to activeOrganizationId on DB error', async () => {
      // Arrange
      const cls = createMockCls(store)
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('DB connection lost')),
            }),
          }),
        }),
      }
      const interceptor = new TenantInterceptor(cls as never, db as never)
      const context = createMockContext({
        session: { activeOrganizationId: 'org-1' },
      })
      const next = createMockCallHandler()

      // Act
      const result$ = interceptor.intercept(context as never, next as never)
      await lastValueFrom(result$)

      // Assert
      expect(cls.set).toHaveBeenCalledWith('tenantId', 'org-1')
    })

    it('should cache resolved tenant ID in CLS and reuse it', async () => {
      // Arrange
      const cls = createMockCls(store)
      const db = createMockDb([{ id: 'org-1', name: 'Root Org' }])
      const interceptor = new TenantInterceptor(cls as never, db as never)
      const context = createMockContext({
        session: { activeOrganizationId: 'org-1' },
      })
      const next = createMockCallHandler()

      // Act - first call triggers DB lookup
      const result1$ = interceptor.intercept(context as never, next as never)
      await lastValueFrom(result1$)

      // Act - second call should use the cached value
      const result2$ = interceptor.intercept(context as never, next as never)
      await lastValueFrom(result2$)

      // Assert - DB select should have been called only once
      expect(db.select).toHaveBeenCalledTimes(1)
      // tenantId should be set twice (once per intercept call)
      const allCalls = (cls.set as ReturnType<typeof vi.fn>).mock.calls as unknown[][]
      const tenantIdCalls = allCalls.filter((call) => call[0] === 'tenantId')
      expect(tenantIdCalls).toHaveLength(2)
      expect(tenantIdCalls[0]?.[1]).toBe('org-1')
      expect(tenantIdCalls[1]?.[1]).toBe('org-1')
    })

    it('should treat null parentOrganizationId as root org', async () => {
      // Arrange
      const cls = createMockCls(store)
      const db = createMockDb([{ id: 'org-1', name: 'Root Org', parentOrganizationId: null }])
      const interceptor = new TenantInterceptor(cls as never, db as never)
      const context = createMockContext({
        session: { activeOrganizationId: 'org-1' },
      })
      const next = createMockCallHandler()

      // Act
      const result$ = interceptor.intercept(context as never, next as never)
      await lastValueFrom(result$)

      // Assert
      expect(cls.set).toHaveBeenCalledWith('tenantId', 'org-1')
    })
  })
})
