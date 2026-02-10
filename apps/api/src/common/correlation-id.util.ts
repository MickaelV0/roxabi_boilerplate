const CORRELATION_ID_PATTERN = /^[\w-]{1,128}$/

export function extractCorrelationId(header: string | string[] | undefined): string | undefined {
  if (!header) return undefined
  const raw = Array.isArray(header) ? header[0] : header.split(',')[0]
  const value = raw?.trim()
  if (value && CORRELATION_ID_PATTERN.test(value)) return value
  return undefined
}
