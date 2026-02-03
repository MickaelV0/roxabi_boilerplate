/**
 * Supported locales in the application
 */
export const LOCALES = ['en', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/**
 * Translation namespaces - each corresponds to a JSON file in locales/
 */
export const NAMESPACES = ['common', 'auth', 'dashboard', 'settings'] as const
export type Namespace = (typeof NAMESPACES)[number]

export const DEFAULT_NAMESPACE: Namespace = 'common'

/**
 * Cookie configuration for locale persistence
 */
export const LOCALE_COOKIE_NAME = 'locale'
export const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

/**
 * i18next resource structure
 */
export type TranslationResources = {
  [key in Locale]: {
    [ns in Namespace]: Record<string, unknown>
  }
}

/**
 * Language detection sources in priority order
 */
export type LanguageDetectionSource = 'path' | 'cookie' | 'header' | 'default'

/**
 * Result of language detection
 */
export type DetectedLanguage = {
  locale: Locale
  source: LanguageDetectionSource
}

/**
 * Locale formatting options
 */
export type FormatOptions = {
  /**
   * Currency code for currency formatting (e.g., 'EUR', 'USD')
   */
  currency?: string
  /**
   * Date style for date formatting
   */
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  /**
   * Time style for time formatting
   */
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  /**
   * Minimum fraction digits for number formatting
   */
  minimumFractionDigits?: number
  /**
   * Maximum fraction digits for number formatting
   */
  maximumFractionDigits?: number
}

/**
 * Locale context value provided by useLocale hook
 */
export type LocaleContext = {
  locale: Locale
  formatDate: (date: Date, options?: FormatOptions) => string
  formatNumber: (value: number, options?: FormatOptions) => string
  formatCurrency: (value: number, currency?: string) => string
}
