import { describe, expect, it, vi } from 'vitest'
import { createApiClient, getApiErrorData, isFetchError } from './api-client.server'

describe('api-client', () => {
  describe('createApiClient', () => {
    it('creates a client with the provided baseURL', () => {
      const client = createApiClient('http://test.example.com')
      expect(client).toBeDefined()
      expect(typeof client).toBe('function')
    })
  })

  describe('isFetchError', () => {
    it('returns true for FetchError-like objects', () => {
      const fetchError = {
        data: { statusCode: 400, message: 'Bad Request' },
        status: 400,
      }
      expect(isFetchError(fetchError)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isFetchError(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isFetchError(undefined)).toBe(false)
    })

    it('returns false for primitive values', () => {
      expect(isFetchError('error')).toBe(false)
      expect(isFetchError(123)).toBe(false)
      expect(isFetchError(true)).toBe(false)
    })

    it('returns false for objects without data property', () => {
      expect(isFetchError({ status: 400 })).toBe(false)
    })

    it('returns false for objects without status property', () => {
      expect(isFetchError({ data: {} })).toBe(false)
    })
  })

  describe('getApiErrorData', () => {
    it('extracts error data from a FetchError', () => {
      const errorData = {
        statusCode: 400,
        timestamp: '2025-01-01T00:00:00.000Z',
        path: '/api/test',
        correlationId: 'test-correlation-id',
        message: 'Bad Request',
      }
      const fetchError = { data: errorData, status: 400 }
      expect(getApiErrorData(fetchError)).toEqual(errorData)
    })

    it('returns null for non-FetchError objects', () => {
      expect(getApiErrorData(new Error('test'))).toBe(null)
      expect(getApiErrorData({})).toBe(null)
      expect(getApiErrorData(null)).toBe(null)
    })

    it('returns null when FetchError has no data', () => {
      const fetchError = { data: null, status: 400 }
      expect(getApiErrorData(fetchError)).toBe(null)
    })
  })

  describe('correlation ID header', () => {
    it('sets x-correlation-id header on requests', async () => {
      const client = createApiClient('http://test.example.com')

      // Mock fetch to capture the request
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      const originalFetch = globalThis.fetch
      globalThis.fetch = mockFetch

      try {
        await client('/health')

        expect(mockFetch).toHaveBeenCalled()
        const call = mockFetch.mock.calls[0] as [string, RequestInit | undefined]
        const [, requestInit] = call
        const headers = new Headers(requestInit?.headers)
        const correlationId = headers.get('x-correlation-id')
        expect(correlationId).toBeDefined()
        expect(correlationId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      } finally {
        globalThis.fetch = originalFetch
      }
    })
  })
})
