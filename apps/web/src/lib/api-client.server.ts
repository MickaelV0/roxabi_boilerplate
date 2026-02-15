import { randomUUID } from 'node:crypto'
import { ofetch } from 'ofetch'
import { env } from './env.server.js'

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
 * Default API client instance using the validated API_URL environment variable.
 */
export const api = createApiClient(env.API_URL)

export type { FetchError } from 'ofetch'
// Re-export error utilities from the shared module (no server-only deps)
export { getApiErrorData, isFetchError } from './api-error-utils.js'
