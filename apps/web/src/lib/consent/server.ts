import type { ConsentCookiePayload } from '@repo/types'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { parseConsentCookie } from '@/lib/consent/parse'

export const getServerConsent = createServerFn({
  method: 'GET',
}).handler(async (): Promise<ConsentCookiePayload | null> => {
  const raw = getCookie('consent')
  return parseConsentCookie(raw)
})
