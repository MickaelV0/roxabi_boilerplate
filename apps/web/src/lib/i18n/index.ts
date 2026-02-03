// Types
export {
  DEFAULT_LOCALE,
  DEFAULT_NAMESPACE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  NAMESPACES,
  type DetectedLanguage,
  type FormatOptions,
  type LanguageDetectionSource,
  type Locale,
  type LocaleContext,
  type Namespace,
  type TranslationResources,
} from './types'

// Configuration
export { getClientConfig, getServerConfig, i18nConfig } from './config'

// Server utilities
export {
  createServerI18n,
  detectLanguage,
  getLocaleFromCookie,
  getLocaleFromHeader,
  getLocaleFromPath,
  getLocaleCookieHeader,
  isValidLocale,
  loadTranslations,
} from './server'

// Client utilities
export {
  addResourceBundle,
  changeLanguage,
  getI18n,
  hasNamespace,
  initClientI18n,
} from './client'

// React hooks
export { useAvailableLocales, useLocale, useTranslation } from './hooks'

// Router context
export { createI18nContext, loadI18nNamespaces, type I18nRouterContext } from './context'

// SEO utilities
export { getCanonicalUrl, HreflangTags } from './seo'
