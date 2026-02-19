import { HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AccountAlreadyDeletedException } from '../exceptions/account-already-deleted.exception.js'
import { AccountAlreadyDeletedFilter } from './account-already-deleted.filter.js'

function createMockCls(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost() {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = {
    url: '/api/users/me/delete',
    method: 'POST',
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

describe('AccountAlreadyDeletedFilter', () => {
  const cls = createMockCls()
  const filter = new AccountAlreadyDeletedFilter(cls as never)

  it('should catch AccountAlreadyDeletedException and return 400 status', () => {
    // Arrange
    const { host, statusFn } = createMockHost()
    const exception = new AccountAlreadyDeletedException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
  })

  it('should return structured error response body', () => {
    // Arrange
    const { host, getSentBody } = createMockHost()
    const exception = new AccountAlreadyDeletedException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.statusCode).toBe(400)
    expect(body.path).toBe('/api/users/me/delete')
    expect(body.correlationId).toBe('test-correlation-id')
    expect(body.message).toBe('Account is already scheduled for deletion')
    expect(body.errorCode).toBe('ACCOUNT_ALREADY_DELETED')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should set x-correlation-id header on response', () => {
    // Arrange
    const { host, headerFn } = createMockHost()
    const exception = new AccountAlreadyDeletedException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })

  it('should use correlation ID from ClsService', () => {
    // Arrange
    const customCls = createMockCls('custom-id-abc')
    const customFilter = new AccountAlreadyDeletedFilter(customCls as never)
    const { host, getSentBody } = createMockHost()
    const exception = new AccountAlreadyDeletedException()

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
    const exception = new AccountAlreadyDeletedException()

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    const timestamp = body.timestamp as string
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
