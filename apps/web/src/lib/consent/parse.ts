import type { ConsentCookiePayload } from '@repo/types'
import { z } from 'zod'

const consentCookieSchema = z.object({
  categories: z.object({
    necessary: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
  consentedAt: z.string().nullable(),
  policyVersion: z.string().nullable(),
  action: z.enum(['accepted', 'rejected', 'customized']).nullable(),
})

export function parseConsentCookie(raw: string | undefined | null): ConsentCookiePayload | null {
  if (!raw) return null
  try {
    // Try URI-decoding first (frontend writes encoded), fall back to raw (API writes raw JSON)
    let jsonString: string
    try {
      jsonString = decodeURIComponent(raw)
    } catch {
      jsonString = raw
    }
    const parsed: unknown = JSON.parse(jsonString)
    const result = consentCookieSchema.safeParse(parsed)
    if (result.success) {
      return result.data
    }
    return null
  } catch {
    return null
  }
}
