import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getClientConfig } from './config'
import type { Locale, Namespace, TranslationResources } from './types'

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
 * Change the current language and persist to cookie
 */
export async function changeLanguage(locale: Locale): Promise<void> {
  await i18next.changeLanguage(locale)

  // Persist to cookie
  document.cookie = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`

  // Reload page to ensure SSR content matches
  // This is the recommended approach for full SSR consistency
  window.location.reload()
}
