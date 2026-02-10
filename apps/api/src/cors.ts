export type CorsOriginResult =
  | { origins: string | string[]; warning?: undefined }
  | { origins: false; warning: string }

export function parseCorsOrigins(rawOrigins: string, isProduction: boolean): CorsOriginResult {
  const origins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  if (isProduction && origins.includes('*')) {
    const safeOrigins = origins.filter((o) => o !== '*')
    if (safeOrigins.length === 0) {
      return {
        origins: false,
        warning: "CORS wildcard '*' is not allowed in production — ignoring wildcard",
      }
    }
    const [singleSafe] = safeOrigins
    return { origins: safeOrigins.length === 1 ? (singleSafe ?? safeOrigins) : safeOrigins }
  }

  const [single] = origins
  return { origins: origins.length === 1 ? (single ?? origins) : origins }
}
