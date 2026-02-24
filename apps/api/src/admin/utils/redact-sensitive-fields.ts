import { SENSITIVE_FIELDS } from '@repo/types'

const SENSITIVE_SET = new Set(SENSITIVE_FIELDS.map((f) => f.toLowerCase()))

export function redactSensitiveFields(
  data: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (data === null) return null
  const redact = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_SET.has(key.toLowerCase())) {
        result[key] = '[REDACTED]'
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = redact(value as Record<string, unknown>)
      } else {
        result[key] = value
      }
    }
    return result
  }
  return redact(data)
}
