import type { ConsentCookiePayload } from '@repo/types'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

function parseConsentCookie(raw: string | undefined | null): ConsentCookiePayload | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded)
    if (parsed && typeof parsed === 'object' && parsed.categories) {
      return parsed as ConsentCookiePayload
    }
    return null
  } catch {
    return null
  }
}

export const getServerConsent = createServerFn({
  method: 'GET',
}).handler(async (): Promise<ConsentCookiePayload | null> => {
  const raw = getCookie('consent')
  return parseConsentCookie(raw)
})
