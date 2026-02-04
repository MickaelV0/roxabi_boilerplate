import type { InitOptions } from 'i18next'
import { DEFAULT_LOCALE, DEFAULT_NAMESPACE, LOCALES, NAMESPACES } from './types'

/**
 * Base i18next configuration shared between server and client
 */
export const i18nConfig: InitOptions = {
  supportedLngs: [...LOCALES],
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: DEFAULT_NAMESPACE,
  ns: [...NAMESPACES],

  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // React settings
  react: {
    useSuspense: true,
  },

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Return empty string for missing keys in production, show key in development
  returnEmptyString: false,
  returnNull: false,

  // Missing key handler for development
  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: (lngs, ns, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${ns}:${key} for languages: ${lngs.join(', ')}`)
    }
  },

  // Missing interpolation handler
  missingInterpolationHandler: (text, value) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing interpolation value for "${value}" in "${text}"`)
    }
    return ''
  },
}

/**
 * Get i18n configuration for server-side rendering
 */
export function getServerConfig(locale: string): InitOptions {
  return {
    ...i18nConfig,
    lng: locale,
    // Server-side specific settings
    initImmediate: false, // Don't load resources async on server
  }
}

/**
 * Get i18n configuration for client-side hydration
 */
export function getClientConfig(locale: string): InitOptions {
  return {
    ...i18nConfig,
    lng: locale,
    // Client-side specific settings
    react: {
      ...i18nConfig.react,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  }
}
