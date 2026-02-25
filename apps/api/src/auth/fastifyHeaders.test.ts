import type { FastifyRequest } from 'fastify'
import { describe, expect, it } from 'vitest'
import { toFetchHeaders } from './fastifyHeaders.js'

function createMockRequest(
  headers: Record<string, string | string[] | undefined | number>
): FastifyRequest {
  return { headers } as unknown as FastifyRequest
}

describe('toFetchHeaders', () => {
  it('should convert simple string headers', () => {
    // Arrange
    const req = createMockRequest({
      'content-type': 'application/json',
      authorization: 'Bearer token',
    })

    // Act
    const result = toFetchHeaders(req)

    // Assert
    expect(result.get('content-type')).toBe('application/json')
    expect(result.get('authorization')).toBe('Bearer token')
  })

  it('should join array-valued headers with comma separator', () => {
    // Arrange
    const req = createMockRequest({ 'set-cookie': ['a=1', 'b=2'] })

    // Act
    const result = toFetchHeaders(req)

    // Assert
    expect(result.get('set-cookie')).toBe('a=1, b=2')
  })

  it('should skip undefined header values', () => {
    // Arrange
    const req = createMockRequest({ 'x-present': 'yes', 'x-missing': undefined })

    // Act
    const result = toFetchHeaders(req)

    // Assert
    expect(result.get('x-present')).toBe('yes')
    expect(result.get('x-missing')).toBeNull()
  })

  it('should handle empty headers object', () => {
    // Arrange
    const req = createMockRequest({})

    // Act
    const result = toFetchHeaders(req)

    // Assert
    expect([...result.entries()]).toHaveLength(0)
  })

  it('should handle numeric header values via String() coercion', () => {
    // Arrange
    const req = createMockRequest({ 'content-length': 42 as unknown as string })

    // Act
    const result = toFetchHeaders(req)

    // Assert
    expect(result.get('content-length')).toBe('42')
  })

  it('should lowercase header keys via the Headers API', () => {
    // Arrange
    const req = createMockRequest({ 'X-Custom-Header': 'value' })

    // Act
    const result = toFetchHeaders(req)

    // Assert
    expect(result.get('x-custom-header')).toBe('value')
  })
})
