import { HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { OrgNotFoundException } from '../exceptions/org-not-found.exception.js'
import { OrgNotFoundFilter } from './org-not-found.filter.js'

function createMockCls(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost() {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = { url: '/api/organizations/org-123' }
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

describe('OrgNotFoundFilter', () => {
  const cls = createMockCls()
  const filter = new OrgNotFoundFilter(cls as never)

  it('should catch OrgNotFoundException and return 404 status', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new OrgNotFoundException('org-123')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
  })

  it('should return structured error response body', () => {
    // Arrange
    const { host, getSentBody } = createMockHost()
    const exception = new OrgNotFoundException('org-456')

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.statusCode).toBe(404)
    expect(body.path).toBe('/api/organizations/org-123')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('Organization org-456 not found')
    expect(body.errorCode).toBe('ORG_NOT_FOUND')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should set x-correlation-id header on response', () => {
    // Arrange
    const { host, headerFn } = createMockHost()
    const exception = new OrgNotFoundException('org-789')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })

  it('should use correlation ID from ClsService', () => {
    // Arrange
    const customCls = createMockCls('custom-id-abc')
    const customFilter = new OrgNotFoundFilter(customCls as never)
    const { host, getSentBody } = createMockHost()
    const exception = new OrgNotFoundException('org-000')

    // Act
    customFilter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.correlationId).toBe('custom-id-abc')
    expect(customCls.getId).toHaveBeenCalled()
  })

  it('should include timestamp as ISO string in response body', () => {
    // Arrange
    const { host, getSentBody } = createMockHost()
    const exception = new OrgNotFoundException('org-111')

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    const timestamp = body.timestamp as string
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
