import { of } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { CorrelationIdInterceptor } from './correlation-id.interceptor.js'

function createMockContext(headers: Record<string, string> = {}) {
  const headerFn = vi.fn()
  const request = { headers: { ...headers } }
  const response = { header: headerFn }

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }

  const next = { handle: () => of('result') }

  return { context, next, request, headerFn } as const
}

describe('CorrelationIdInterceptor', () => {
  const interceptor = new CorrelationIdInterceptor()

  it('should use existing x-correlation-id header', () => {
    const { context, next, request, headerFn } = createMockContext({
      'x-correlation-id': 'existing-id',
    })

    interceptor.intercept(context as never, next)

    expect(request.headers['x-correlation-id']).toBe('existing-id')
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'existing-id')
  })

  it('should generate a UUID when no correlation ID header', () => {
    const { context, next, request, headerFn } = createMockContext()

    interceptor.intercept(context as never, next)

    const id = request.headers['x-correlation-id']
    expect(id).toBeDefined()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', id)
  })

  it('should call next.handle()', () => {
    const { context, next } = createMockContext()
    const handleSpy = vi.spyOn(next, 'handle')

    interceptor.intercept(context as never, next)

    expect(handleSpy).toHaveBeenCalled()
  })
})
