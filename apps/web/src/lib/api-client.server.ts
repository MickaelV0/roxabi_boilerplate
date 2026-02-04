import { randomUUID } from 'node:crypto'
import type { ApiErrorResponse } from '@repo/types'
import { type FetchError, ofetch } from 'ofetch'

const CORRELATION_ID_HEADER = 'x-correlation-id'

export function createApiClient(baseURL: string) {
  return ofetch.create({
    baseURL,
    onRequest({ options }) {
      const headers = new Headers(options.headers)

      if (!headers.has(CORRELATION_ID_HEADER)) {
        headers.set(CORRELATION_ID_HEADER, randomUUID())
      }

      options.headers = headers
    },
  })
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return typeof data === 'object' && data !== null && 'statusCode' in data && 'message' in data
}

export function getApiErrorData(error: FetchError): ApiErrorResponse | undefined {
  return isApiErrorResponse(error.data) ? error.data : undefined
}

const API_URL =
  process.env.API_URL ??
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('API_URL environment variable is required in production')
      })()
    : 'http://localhost:3001')

export const api = createApiClient(API_URL)
