import { describe, expect, it, vi } from 'vitest'
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

function createMockCallHandler() {
  const handle = vi.fn().mockReturnValue({ pipe: vi.fn() })
  return { handle }
}

describe('TenantInterceptor', () => {
  it('should set tenantId in CLS when activeOrganizationId is present', () => {
    // Arrange
    const store: Record<string, unknown> = {}
    const cls = createMockCls(store)
    const interceptor = new TenantInterceptor(cls as never)
    const context = createMockContext({
      session: { activeOrganizationId: 'org-1' },
    })
    const next = createMockCallHandler()

    // Act
    interceptor.intercept(context as never, next as never)

    // Assert
    expect(cls.set).toHaveBeenCalledWith('tenantId', 'org-1')
  })

  it('should set tenantId to null when no session exists', () => {
    // Arrange
    const store: Record<string, unknown> = {}
    const cls = createMockCls(store)
    const interceptor = new TenantInterceptor(cls as never)
    const context = createMockContext(null)
    const next = createMockCallHandler()

    // Act
    interceptor.intercept(context as never, next as never)

    // Assert
    expect(cls.set).toHaveBeenCalledWith('tenantId', null)
  })

  it('should set tenantId to null when activeOrganizationId is null', () => {
    // Arrange
    const store: Record<string, unknown> = {}
    const cls = createMockCls(store)
    const interceptor = new TenantInterceptor(cls as never)
    const context = createMockContext({
      session: { activeOrganizationId: null },
    })
    const next = createMockCallHandler()

    // Act
    interceptor.intercept(context as never, next as never)

    // Assert
    expect(cls.set).toHaveBeenCalledWith('tenantId', null)
  })

  it('should call next.handle() to continue the request pipeline', () => {
    // Arrange
    const cls = createMockCls()
    const interceptor = new TenantInterceptor(cls as never)
    const context = createMockContext({
      session: { activeOrganizationId: 'org-1' },
    })
    const next = createMockCallHandler()

    // Act
    interceptor.intercept(context as never, next as never)

    // Assert
    expect(next.handle).toHaveBeenCalled()
  })

  // TODO: test child org → parent org resolution once implemented
})
