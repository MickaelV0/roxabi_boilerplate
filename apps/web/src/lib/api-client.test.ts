import { describe, expect, it, vi } from 'vitest'
import { createApiClient, getApiErrorData, isFetchError } from './api-client.server'

describe('api-client', () => {
  describe('createApiClient', () => {
    it('should create a client with the provided baseURL', () => {
      // Arrange & Act
      const client = createApiClient('http://test.example.com')

      // Assert
      expect(client).toBeDefined()
      expect(typeof client).toBe('function')
    })
  })

  describe('isFetchError', () => {
    it('should return true for FetchError-like objects', () => {
      // Arrange
      const fetchError = {
        data: { statusCode: 400, message: 'Bad Request' },
        status: 400,
      }

      // Act
      const result = isFetchError(fetchError)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for null', () => {
      // Act
      const result = isFetchError(null)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for undefined', () => {
      // Act
      const result = isFetchError(undefined)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for primitive values', () => {
      // Act & Assert
      expect(isFetchError('error')).toBe(false)
      expect(isFetchError(123)).toBe(false)
      expect(isFetchError(true)).toBe(false)
    })

    it('should return false for objects without data property', () => {
      // Arrange
      const error = { status: 400 }

      // Act
      const result = isFetchError(error)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for objects without status property', () => {
      // Arrange
      const error = { data: {} }

      // Act
      const result = isFetchError(error)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getApiErrorData', () => {
    it('should extract error data from a FetchError', () => {
      // Arrange
      const errorData = {
        statusCode: 400,
        timestamp: '2025-01-01T00:00:00.000Z',
        path: '/api/test',
        correlationId: 'test-correlation-id',
        message: 'Bad Request',
      }
      const fetchError = { data: errorData, status: 400 }

      // Act
      const result = getApiErrorData(fetchError)

      // Assert
      expect(result).toEqual(errorData)
    })

    it('should return null for non-FetchError objects', () => {
      // Act & Assert
      expect(getApiErrorData(new Error('test'))).toBe(null)
      expect(getApiErrorData({})).toBe(null)
      expect(getApiErrorData(null)).toBe(null)
    })

    it('should return null when FetchError has no data', () => {
      // Arrange
      const fetchError = { data: null, status: 400 }

      // Act
      const result = getApiErrorData(fetchError)

      // Assert
      expect(result).toBe(null)
    })
  })

  describe('correlation ID header', () => {
    it('should set x-correlation-id header on requests', async () => {
      // Arrange
      const client = createApiClient('http://test.example.com')
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )

      try {
        // Act
        await client('/health')

        // Assert
        expect(fetchSpy).toHaveBeenCalled()
        const call = fetchSpy.mock.calls[0] as [string, RequestInit | undefined]
        const [, requestInit] = call
        const headers = new Headers(requestInit?.headers)
        const correlationId = headers.get('x-correlation-id')
        expect(correlationId).toBeDefined()
        expect(correlationId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      } finally {
        fetchSpy.mockRestore()
      }
    })
  })
})
