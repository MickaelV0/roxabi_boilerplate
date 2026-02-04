import { HttpException, HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { AllExceptionsFilter } from './all-exceptions.filter'

function createMockHost(headers: Record<string, string> = {}) {
  const sendFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = {
    url: '/test',
    method: 'GET',
    headers: { 'x-correlation-id': 'test-id', ...headers },
  }
  const response = { status: statusFn }

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

  return { host, statusFn, getSentBody } as const
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter()

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

  it('should use "unknown" when no correlation ID header', () => {
    const { host, getSentBody } = createMockHost({ 'x-correlation-id': '' })

    filter.catch(new Error('fail'), host as never)

    const body = getSentBody()
    expect(body.correlationId).toBe('unknown')
  })

  it('should include timestamp and path', () => {
    const { host, getSentBody } = createMockHost()

    filter.catch(new Error('fail'), host as never)

    const body = getSentBody()
    expect(body.timestamp).toBeDefined()
    expect(body.path).toBe('/test')
  })
})
