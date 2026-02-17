import { HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { ConsentInsertFailedException } from '../exceptions/consent-insert-failed.exception.js'
import { ConsentNotFoundException } from '../exceptions/consent-not-found.exception.js'
import { ConsentExceptionFilter } from './consent-exception.filter.js'

function createMockCls(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost(requestOverrides: Record<string, unknown> = {}) {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = {
    url: '/api/consent',
    method: 'GET',
    ...requestOverrides,
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

describe('ConsentExceptionFilter', () => {
  const cls = createMockCls()
  const filter = new ConsentExceptionFilter(cls as never)

  it('should return 404 with errorCode CONSENT_NOT_FOUND for ConsentNotFoundException', () => {
    // Arrange
    const { host, statusFn, getSentBody } = createMockHost()
    const exception = new ConsentNotFoundException('user-123')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    const body = getSentBody()
    expect(body.statusCode).toBe(404)
    expect(body.errorCode).toBe('CONSENT_NOT_FOUND')
  })

  it('should return 500 with errorCode CONSENT_INSERT_FAILED for ConsentInsertFailedException', () => {
    // Arrange
    const { host, statusFn, getSentBody } = createMockHost()
    const exception = new ConsentInsertFailedException('user-456')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    const body = getSentBody()
    expect(body.statusCode).toBe(500)
    expect(body.errorCode).toBe('CONSENT_INSERT_FAILED')
  })

  it('should include correlationId from ClsService in response', () => {
    // Arrange
    const customCls = createMockCls('my-correlation-id')
    const customFilter = new ConsentExceptionFilter(customCls as never)
    const { host, getSentBody } = createMockHost()
    const exception = new ConsentNotFoundException('user-1')

    // Act
    customFilter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.correlationId).toBe('my-correlation-id')
    expect(customCls.getId).toHaveBeenCalled()
  })

  it('should include timestamp and path in response', () => {
    // Arrange
    const { host, getSentBody } = createMockHost({ url: '/api/consent/user-1' })
    const exception = new ConsentNotFoundException('user-1')

    // Act
    filter.catch(exception, host as never)

    // Assert
    const body = getSentBody()
    expect(body.timestamp).toBeDefined()
    expect(typeof body.timestamp).toBe('string')
    expect(body.path).toBe('/api/consent/user-1')
  })

  it('should NOT leak userId in the response message', () => {
    // Arrange
    const userId = 'secret-user-id-42'
    const { host, getSentBody } = createMockHost()
    const notFoundException = new ConsentNotFoundException(userId)
    const insertFailedException = new ConsentInsertFailedException(userId)

    // Act — test ConsentNotFoundException
    filter.catch(notFoundException, host as never)
    const notFoundBody = getSentBody()

    // Assert — userId must not appear in message
    expect(notFoundBody.message).not.toContain(userId)
    expect(JSON.stringify(notFoundBody)).not.toContain(userId)

    // Act — test ConsentInsertFailedException
    const { host: host2, getSentBody: getSentBody2 } = createMockHost()
    filter.catch(insertFailedException, host2 as never)
    const insertFailedBody = getSentBody2()

    // Assert — userId must not appear in message
    expect(insertFailedBody.message).not.toContain(userId)
    expect(JSON.stringify(insertFailedBody)).not.toContain(userId)
  })

  it('should set x-correlation-id response header', () => {
    // Arrange
    const { host, headerFn } = createMockHost()
    const exception = new ConsentNotFoundException('user-1')

    // Act
    filter.catch(exception, host as never)

    // Assert
    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id')
  })
})
