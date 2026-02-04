import type { ApiErrorResponse } from '@repo/types'
import type { FetchError } from 'ofetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient, getApiErrorData } from './api-client.server'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

describe('createApiClient', () => {
  it('sends requests to the configured base URL', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    const api = createApiClient('http://api.test:3001')
    const result = await api('/health')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0]!
    expect(url).toBe('http://api.test:3001/health')
    expect(result).toEqual({ status: 'ok' })
  })

  it('adds x-correlation-id header to every request', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    const api = createApiClient('http://api.test:3001')
    await api('/health')

    const [, options] = mockFetch.mock.calls[0]!
    const headers = new Headers(options.headers as HeadersInit)
    const correlationId = headers.get('x-correlation-id')
    expect(correlationId).toBeTruthy()
    expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('preserves a provided x-correlation-id header', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    const api = createApiClient('http://api.test:3001')
    await api('/health', {
      headers: { 'x-correlation-id': 'custom-id-123' },
    })

    const [, options] = mockFetch.mock.calls[0]!
    const headers = new Headers(options.headers as HeadersInit)
    expect(headers.get('x-correlation-id')).toBe('custom-id-123')
  })

  it('throws on HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 404, message: 'Not Found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    )

    const api = createApiClient('http://api.test:3001')
    await expect(api('/missing')).rejects.toThrow()
  })
})

describe('getApiErrorData', () => {
  it('extracts ApiErrorResponse from FetchError.data', () => {
    const errorData: ApiErrorResponse = {
      statusCode: 400,
      timestamp: '2025-01-01T00:00:00.000Z',
      path: '/test',
      correlationId: 'abc-123',
      message: 'Bad Request',
    }

    const error = { data: errorData } as FetchError
    expect(getApiErrorData(error)).toEqual(errorData)
  })

  it('returns undefined when no data is present', () => {
    const error = { data: undefined } as FetchError
    expect(getApiErrorData(error)).toBeUndefined()
  })

  it('returns undefined when data does not match ApiErrorResponse shape', () => {
    const error = { data: { unexpected: 'shape' } } as FetchError
    expect(getApiErrorData(error)).toBeUndefined()
  })
})

describe('correlation ID uniqueness', () => {
  it('generates unique correlation IDs for consecutive requests', async () => {
    for (let i = 0; i < 3; i++) {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
    }

    const api = createApiClient('http://api.test:3001')
    await api('/a')
    await api('/b')
    await api('/c')

    const ids = mockFetch.mock.calls.map(([, options]: [string, RequestInit]) => {
      const headers = new Headers(options.headers as HeadersInit)
      return headers.get('x-correlation-id')
    })

    const unique = new Set(ids)
    expect(unique.size).toBe(3)
  })
})

describe('error handling edge cases', () => {
  it('throws on non-JSON error responses', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('<html>502 Bad Gateway</html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      })
    )

    const api = createApiClient('http://api.test:3001')
    await expect(api('/health')).rejects.toThrow()
  })

  it('throws on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))

    const api = createApiClient('http://api.test:3001')
    await expect(api('/health')).rejects.toThrow()
  })
})
