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

export function getApiErrorData(error: FetchError): ApiErrorResponse | undefined {
  return error.data as ApiErrorResponse | undefined
}

export const api = createApiClient(process.env.API_URL ?? 'http://localhost:3001')
