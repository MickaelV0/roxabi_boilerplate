import { HttpException, HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { AllExceptionsFilter } from './all-exceptions.filter.js'

function createMockCls(id = 'test-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost() {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = {
    url: '/test',
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

describe('AllExceptionsFilter', () => {
  const cls = createMockCls()
  const filter = new AllExceptionsFilter(cls as never)

  it('should handle HttpException with string response', () => {
    const { host, statusFn, getSentBody } = createMockHost()
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND)

    filter.catch(exception, host as never)

    expect(statusFn).toHaveBeenCalledWith(404)
    const body = getSentBody()
    expect(body.statusCode).toBe(404)
    expect(body.message).toBe('Not found')
    expect(body.correlationId).toBe('test-id')
    expect(body.path).toBe('/test')
  })

  it('should handle HttpException with object response (validation errors)', () => {
    const { host, statusFn, getSentBody } = createMockHost()
    const exception = new HttpException(
      { statusCode: 400, message: ['field is required', 'name too short'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST
    )

    filter.catch(exception, host as never)

    expect(statusFn).toHaveBeenCalledWith(400)
    const body = getSentBody()
    expect(body.message).toEqual(['field is required', 'name too short'])
  })

  it('should handle HttpException with object response (single message)', () => {
    const { host, getSentBody } = createMockHost()
    const exception = new HttpException(
      { statusCode: 403, message: 'Forbidden resource' },
      HttpStatus.FORBIDDEN
    )

    filter.catch(exception, host as never)

    const body = getSentBody()
    expect(body.message).toBe('Forbidden resource')
  })

  it('should handle non-HttpException with generic message', () => {
    const { host, statusFn, getSentBody } = createMockHost()
    const exception = new Error('something broke')

    filter.catch(exception, host as never)

    expect(statusFn).toHaveBeenCalledWith(500)
    const body = getSentBody()
    expect(body.message).toBe('Internal server error')
  })

  it('should use correlation ID from ClsService', () => {
    const customCls = createMockCls('custom-correlation-id')
    const customFilter = new AllExceptionsFilter(customCls as never)
    const { host, getSentBody } = createMockHost()

    customFilter.catch(new Error('fail'), host as never)

    const body = getSentBody()
    expect(body.correlationId).toBe('custom-correlation-id')
    expect(customCls.getId).toHaveBeenCalled()
  })

  it('should set x-correlation-id response header on errors', () => {
    const { host, headerFn } = createMockHost()

    filter.catch(new Error('fail'), host as never)

    expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-id')
  })

  it('should include timestamp and path', () => {
    const { host, getSentBody } = createMockHost()

    filter.catch(new Error('fail'), host as never)

    const body = getSentBody()
    expect(body.timestamp).toBeDefined()
    expect(body.path).toBe('/test')
  })
})
