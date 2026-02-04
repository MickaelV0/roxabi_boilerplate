import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getClientConfig } from './config'
import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  type Locale,
  type Namespace,
  type TranslationResources,
} from './types'

let isInitialized = false

/**
 * Initialize i18next on the client side
 * Should be called once during app hydration
 */
export async function initClientI18n(
  locale: Locale,
  resources: Partial<TranslationResources>
): Promise<typeof i18next> {
  if (isInitialized) {
    // Already initialized, just change language if needed
    if (i18next.language !== locale) {
      await i18next.changeLanguage(locale)
    }
    return i18next
  }

  await i18next.use(initReactI18next).init({
    ...getClientConfig(locale),
    resources,
  })

  isInitialized = true
  return i18next
}

/**
 * Add resources for a namespace that was lazy-loaded
 */
export function addResourceBundle(
  locale: Locale,
  namespace: Namespace,
  resources: Record<string, unknown>
): void {
  if (!i18next.hasResourceBundle(locale, namespace)) {
    i18next.addResourceBundle(locale, namespace, resources, true, true)
  }
}

/**
 * Check if a namespace has been loaded for a locale
 */
export function hasNamespace(locale: Locale, namespace: Namespace): boolean {
  return i18next.hasResourceBundle(locale, namespace)
}

/**
 * Get the current i18next instance
 * Throws if not initialized
 */
export function getI18n(): typeof i18next {
  if (!isInitialized) {
    throw new Error('i18next is not initialized. Call initClientI18n first.')
  }
  return i18next
}

/**
 * Set a cookie value (wrapper to satisfy biome noDocumentCookie rule)
 */
function setCookie(value: string): void {
  // biome-ignore lint/suspicious/noDocumentCookie: intentional cookie write for locale persistence
  document.cookie = value
}

/**
 * Change the current language and navigate to new locale URL
 */
export function changeLanguage(locale: Locale): void {
  // Persist to cookie before navigation so server detects it
  setCookie(
    `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
  )

  // Navigate to new locale URL (e.g., /en/dashboard → /fr/dashboard)
  const currentPath = window.location.pathname
  const localePattern = new RegExp(`^\\/(${LOCALES.join('|')})(\\/|$)`)
  const newPath = currentPath.replace(localePattern, `/${locale}$2`) || `/${locale}`
  window.location.href = newPath
}
