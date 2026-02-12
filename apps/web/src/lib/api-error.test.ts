import type { ApiErrorResponse } from '@repo/types'
import { describe, expect, it } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

mockParaglideMessages()

import { translateApiError } from './api-error'

function makeError(overrides: Partial<ApiErrorResponse> = {}): ApiErrorResponse {
  return {
    statusCode: 400,
    timestamp: '2025-01-01T00:00:00.000Z',
    path: '/api/test',
    correlationId: 'test-id',
    message: 'Fallback message',
    ...overrides,
  }
}

describe('translateApiError', () => {
  it('should return translated message for known error code', () => {
    const result = translateApiError(makeError({ errorCode: 'ROLE_NOT_FOUND' }))
    expect(result).toBe('error_ROLE_NOT_FOUND')
  })

  it('should return translated message for each known error code', () => {
    const codes = [
      'ROLE_NOT_FOUND',
      'ROLE_SLUG_CONFLICT',
      'DEFAULT_ROLE_CONSTRAINT',
      'OWNERSHIP_CONSTRAINT',
      'MEMBER_NOT_FOUND',
      'TENANT_CONTEXT_MISSING',
      'DATABASE_UNAVAILABLE',
      'USER_NOT_FOUND',
    ]
    for (const code of codes) {
      const result = translateApiError(makeError({ errorCode: code }))
      expect(result).toBe(`error_${code}`)
    }
  })

  it('should fall back to raw message for unknown error code', () => {
    const result = translateApiError(makeError({ errorCode: 'UNKNOWN_CODE' }))
    expect(result).toBe('Fallback message')
  })

  it('should fall back to raw message when errorCode is undefined', () => {
    const result = translateApiError(makeError({ errorCode: undefined }))
    expect(result).toBe('Fallback message')
  })

  it('should join array messages when falling back', () => {
    const result = translateApiError(
      makeError({ message: ['error one', 'error two'], errorCode: undefined })
    )
    expect(result).toBe('error one, error two')
  })

  it('should prefer errorCode translation over raw message', () => {
    const result = translateApiError(
      makeError({ message: 'Role r-123 not found', errorCode: 'ROLE_NOT_FOUND' })
    )
    expect(result).toBe('error_ROLE_NOT_FOUND')
  })
})
