import type { ApiErrorResponse } from '@repo/types'
import type { FetchError } from 'ofetch'

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
