import { HttpException, HttpStatus, Logger } from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import { describe, expect, it, vi } from 'vitest'

import { AllExceptionsFilter } from './allExceptions.filter.js'

function createMockCls(id = 'test-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createMockHost(requestOverrides: Record<string, unknown> = {}) {
  const sendFn = vi.fn()
  const headerFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ send: sendFn })

  const request = {
    url: '/test',
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

  it('should include errorCode when exception has one', () => {
    const { host, getSentBody } = createMockHost()
    const exception = Object.assign(new Error('fail'), { errorCode: 'ROLE_NOT_FOUND' })

    filter.catch(exception, host as never)

    const body = getSentBody()
    expect(body.errorCode).toBe('ROLE_NOT_FOUND')
  })

  it('should omit errorCode when exception does not have one', () => {
    const { host, getSentBody } = createMockHost()

    filter.catch(new Error('plain error'), host as never)

    const body = getSentBody()
    expect(body.errorCode).toBeUndefined()
  })

  describe('ThrottlerException handling', () => {
    it('should return 429 with Retry-After header for ThrottlerException', () => {
      // Arrange
      const { host, statusFn, headerFn, getSentBody } = createMockHost()
      const exception = new ThrottlerException()

      // Act
      filter.catch(exception, host as never)

      // Assert
      expect(statusFn).toHaveBeenCalledWith(429)
      expect(headerFn).toHaveBeenCalledWith('Retry-After', expect.any(String))
      const body = getSentBody()
      expect(body.statusCode).toBe(429)
      expect(body.message).toBe('Too Many Requests')
    })

    it('should include X-RateLimit-* headers on 429 response when throttlerMeta is set', () => {
      // Arrange
      const throttlerMeta = {
        limit: 60,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 30,
        tierName: 'global',
        tracker: 'ip:127.0.0.1',
      }
      const { host, headerFn, getSentBody } = createMockHost({ throttlerMeta })
      const exception = new ThrottlerException()

      // Act
      filter.catch(exception, host as never)

      // Assert
      expect(headerFn).toHaveBeenCalledWith('Retry-After', expect.any(String))
      expect(headerFn).toHaveBeenCalledWith('X-RateLimit-Limit', '60')
      expect(headerFn).toHaveBeenCalledWith('X-RateLimit-Remaining', '0')
      expect(headerFn).toHaveBeenCalledWith('X-RateLimit-Reset', String(throttlerMeta.reset))
      const body = getSentBody()
      expect(body.statusCode).toBe(429)
    })

    it('should use errorCode RATE_LIMIT_EXCEEDED in response body', () => {
      // Arrange
      const { host, getSentBody } = createMockHost()
      const exception = new ThrottlerException()

      // Act
      filter.catch(exception, host as never)

      // Assert
      const body = getSentBody()
      expect(body.errorCode).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should log 429 at warn level with tracker, path, and tier', () => {
      // Arrange
      const throttlerMeta = {
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
        tierName: 'auth',
        tracker: 'ip:10.0.0.1',
      }
      const { host } = createMockHost({ url: '/api/auth/sign-in', throttlerMeta })
      const exception = new ThrottlerException()

      const logger = Reflect.get(filter, 'logger') as Logger
      const warnSpy = vi.spyOn(logger, 'warn')

      // Act
      filter.catch(exception, host as never)

      // Assert -- logged at warn (not error), with structured info
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('RATE_LIMIT'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('tracker=ip:10.0.0.1'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('path=/api/auth/sign-in'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('tier=auth'))

      warnSpy.mockRestore()
    })

    it('should default Retry-After to 60 when throttlerMeta is absent', () => {
      // Arrange
      const { host, headerFn } = createMockHost()
      const exception = new ThrottlerException()

      // Act
      filter.catch(exception, host as never)

      // Assert
      expect(headerFn).toHaveBeenCalledWith('Retry-After', '60')
    })

    it('should set x-correlation-id header on 429 response', () => {
      // Arrange
      const { host, headerFn } = createMockHost()
      const exception = new ThrottlerException()

      // Act
      filter.catch(exception, host as never)

      // Assert
      expect(headerFn).toHaveBeenCalledWith('x-correlation-id', 'test-id')
    })
  })
})
