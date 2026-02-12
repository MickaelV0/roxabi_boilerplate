import { HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { TenantContextMissingException } from '../exceptions/tenant-context-missing.exception.js'
import { TenantContextMissingFilter } from './tenant-context-missing.filter.js'

function createMockCls(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost() {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = {
    url: '/api/tenants/settings',
    method: 'GET',
  }
  const response = { status: statusFn, header: headerFn }

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }

  const getSentBody = () => {
    const call = sendFn.mock.calls[0]
    expect(call).toBeDefined()
    return call?.[0] as Record<string, unknown>
  }

  return { host, statusFn, headerFn, getSentBody } as const
}

describe('TenantContextMissingFilter', () => {
  const cls = createMockCls()
  const filter = new TenantContextMissingFilter(cls as never)

  it('should catch TenantContextMissingException and return 403 status', () => {
    const { host, statusFn } = createMockHost()
    const exception = new TenantContextMissingException()

    filter.catch(exception, host as never)

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
  })

  it('should return structured error response body', () => {
    const { host, getSentBody } = createMockHost()
    const exception = new TenantContextMissingException()

    filter.catch(exception, host as never)

    const body = getSentBody()
    expect(body.statusCode).toBe(403)
    expect(body.timestamp).toBeDefined()
    expect(body.path).toBe('/api/tenants/settings')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('No tenant context available')
    expect(body.errorCode).toBe('TENANT_CONTEXT_MISSING')
  })

  it('should set x-correlation-id header on response', () => {
    const { host, headerFn } = createMockHost()
    const exception = new TenantContextMissingException()

    filter.catch(exception, host as never)

    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })

  it('should use correlation ID from ClsService', () => {
    const customCls = createMockCls('custom-id-abc')
    const customFilter = new TenantContextMissingFilter(customCls as never)
    const { host, getSentBody } = createMockHost()
    const exception = new TenantContextMissingException()

    customFilter.catch(exception, host as never)

    const body = getSentBody()
    expect(body.correlationId).toBe('custom-id-abc')
    expect(customCls.getId).toHaveBeenCalled()
  })

  it('should include timestamp as ISO string in response body', () => {
    const { host, getSentBody } = createMockHost()
    const exception = new TenantContextMissingException()

    filter.catch(exception, host as never)

    const body = getSentBody()
    const timestamp = body.timestamp as string
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
