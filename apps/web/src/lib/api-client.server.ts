import { randomUUID } from 'node:crypto'
import { ofetch } from 'ofetch'

/** Default API URL for local development */
const DEFAULT_API_URL = 'http://localhost:4000'

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
 * Fallback to DEFAULT_API_URL for local development.
 */
export const api = createApiClient(process.env.API_URL || DEFAULT_API_URL)

export type { FetchError } from 'ofetch'
// Re-export error utilities from the shared module (no server-only deps)
export { getApiErrorData, isFetchError } from './api-error-utils.js'
