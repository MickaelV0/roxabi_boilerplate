import type { ApiErrorResponse } from '@repo/types'
import { m } from '@/paraglide/messages'

const errorCodeToMessage: Record<string, () => string> = {
  ROLE_NOT_FOUND: m.error_ROLE_NOT_FOUND,
  ROLE_SLUG_CONFLICT: m.error_ROLE_SLUG_CONFLICT,
  DEFAULT_ROLE_CONSTRAINT: m.error_DEFAULT_ROLE_CONSTRAINT,
  OWNERSHIP_CONSTRAINT: m.error_OWNERSHIP_CONSTRAINT,
  MEMBER_NOT_FOUND: m.error_MEMBER_NOT_FOUND,
  TENANT_CONTEXT_MISSING: m.error_TENANT_CONTEXT_MISSING,
  DATABASE_UNAVAILABLE: m.error_DATABASE_UNAVAILABLE,
  USER_NOT_FOUND: m.error_USER_NOT_FOUND,
}

/**
 * Translates an API error response to a localized message.
 * Falls back to the raw message if no translation exists for the error code.
 */
export function translateApiError(error: ApiErrorResponse): string {
  const messageFn = error.errorCode ? errorCodeToMessage[error.errorCode] : undefined
  if (messageFn) {
    return messageFn()
  }
  return Array.isArray(error.message) ? error.message.join(', ') : error.message
}
