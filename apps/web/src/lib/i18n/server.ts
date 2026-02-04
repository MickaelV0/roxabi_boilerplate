import {
  DEFAULT_LOCALE,
  type DetectedLanguage,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  type Locale,
  type Namespace,
} from './types'

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return LOCALES.includes(locale as Locale)
}

/**
 * Check if a string looks like a locale code (2-letter format)
 */
export function looksLikeLocale(segment: string): boolean {
  return /^[a-z]{2}$/i.test(segment)
}

/**
 * Check if a URL path has an invalid locale prefix and return redirect info
 * Returns the corrected path if redirect is needed, null otherwise
 *
 * Examples:
 * - /de/dashboard → /en/dashboard (invalid locale)
 * - /xyz/settings → /en/settings (invalid locale that looks like locale code)
 * - /en/dashboard → null (valid locale)
 * - /dashboard → null (no locale prefix)
 * - /docs/api → null (doesn't look like locale)
 */
export function getInvalidLocaleRedirect(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  // No first segment or doesn't look like a locale - no redirect needed
  if (!firstSegment || !looksLikeLocale(firstSegment)) {
    return null
  }

  // Valid locale - no redirect needed
  if (isValidLocale(firstSegment)) {
    return null
  }

  // Invalid locale detected - build redirect path with default locale
  const restOfPath = segments.slice(1).join('/')
  return `/${DEFAULT_LOCALE}${restOfPath ? `/${restOfPath}` : ''}`
}

/**
 * Parse locale from URL path (e.g., /fr/dashboard -> 'fr')
 */
export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment
  }

  return null
}

/**
 * Parse locale from cookie header
 */
export function getLocaleFromCookie(cookieHeader: string | null): Locale | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>
  )

  const locale = cookies[LOCALE_COOKIE_NAME]
  return locale && isValidLocale(locale) ? locale : null
}

/**
 * Parse locale from Accept-Language header
 */
export function getLocaleFromHeader(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null

  // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en;q=0.8")
  const languages = acceptLanguage.split(',').map((lang) => {
    const [locale, quality] = lang.trim().split(';q=')
    return {
      locale: locale?.split('-')[0]?.toLowerCase() ?? '',
      quality: quality ? Number.parseFloat(quality) : 1,
    }
  })

  // Sort by quality and find first matching locale
  languages.sort((a, b) => b.quality - a.quality)

  for (const { locale } of languages) {
    if (isValidLocale(locale)) {
      return locale
    }
  }

  return null
}

/**
 * Detect language from request using priority: path > cookie > header > default
 */
export function detectLanguage(
  pathname: string,
  cookieHeader: string | null,
  acceptLanguage: string | null
): DetectedLanguage {
  // 1. URL path takes highest priority
  const pathLocale = getLocaleFromPath(pathname)
  if (pathLocale) {
    return { locale: pathLocale, source: 'path' }
  }

  // 2. Cookie (user's previous preference)
  const cookieLocale = getLocaleFromCookie(cookieHeader)
  if (cookieLocale) {
    return { locale: cookieLocale, source: 'cookie' }
  }

  // 3. Accept-Language header (browser preference)
  const headerLocale = getLocaleFromHeader(acceptLanguage)
  if (headerLocale) {
    return { locale: headerLocale, source: 'header' }
  }

  // 4. Default fallback
  return { locale: DEFAULT_LOCALE, source: 'default' }
}

/**
 * Generate Set-Cookie header for locale persistence
 */
export function getLocaleCookieHeader(locale: Locale): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
}

/**
 * Pre-load all translation files using Vite's import.meta.glob
 * This allows Vite to statically analyze the imports
 */
const translationModules = import.meta.glob<{ default: Record<string, unknown> }>(
  '../../locales/**/*.json',
  { eager: true }
)

/**
 * Load translation resources for a given locale and namespaces
 */
export async function loadTranslations(
  locale: Locale,
  namespaces: Namespace[]
): Promise<Record<Namespace, Record<string, unknown>>> {
  const resources = {} as Record<Namespace, Record<string, unknown>>

  for (const ns of namespaces) {
    const path = `../../locales/${locale}/${ns}.json`
    const module = translationModules[path]

    if (module) {
      resources[ns] = module.default
    } else {
      console.warn(`Failed to load translations for ${locale}/${ns}`)
      resources[ns] = {}
    }
  }

  return resources
}
