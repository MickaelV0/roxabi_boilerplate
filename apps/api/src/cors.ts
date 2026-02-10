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
    return { origins: safeOrigins.length === 1 ? safeOrigins[0]! : safeOrigins }
  }

  return { origins: origins.length === 1 ? origins[0]! : origins }
}
