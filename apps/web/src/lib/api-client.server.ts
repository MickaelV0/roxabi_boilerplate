import { randomUUID } from 'node:crypto'
import type { ApiErrorResponse } from '@repo/types'
import { type FetchError, ofetch } from 'ofetch'

/**
 * Creates a configured ofetch instance for API communication.
 *
 * Features:
 * - Automatic correlation ID header on every request
 * - Retry logic for transient errors (408, 429, 5xx)
 * - Auto JSON parsing
 */
export function createApiClient(baseURL: string) {
  return ofetch.create({
    baseURL,
    retry: 1,
    retryDelay: 500,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    onRequest({ options }) {
      const correlationId = randomUUID()
      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('x-correlation-id', correlationId)
      options.headers = headers
    },
  })
}

/**
 * Default API client instance using the API_URL environment variable.
 * Fallback to localhost:4000 for local development.
 */
export const api = createApiClient(process.env.API_URL || 'http://localhost:4000')

/**
 * Type guard to check if an error is a FetchError with API error data.
 */
export function isFetchError(error: unknown): error is FetchError<ApiErrorResponse> {
  return error !== null && typeof error === 'object' && 'data' in error && 'status' in error
}

/**
 * Extracts the typed error data from a FetchError.
 * Returns null if the error is not a FetchError or has no data.
 */
export function getApiErrorData(error: unknown): ApiErrorResponse | null {
  if (isFetchError(error) && error.data) {
    return error.data
  }
  return null
}

export type { FetchError } from 'ofetch'
