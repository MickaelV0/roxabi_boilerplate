import { DICEBEAR_CDN_BASE } from '@repo/types'

export function buildDiceBearUrl(
  style: string,
  seed: string,
  options: Record<string, unknown> = {}
): string {
  const params = new URLSearchParams({ seed })
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null) {
      params.set(key, Array.isArray(value) ? value.join(',') : String(value))
    }
  }
  return `${DICEBEAR_CDN_BASE}/${style}/svg?${params.toString()}`
}
