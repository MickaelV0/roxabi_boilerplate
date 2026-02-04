// Types

// Client utilities
export {
  addResourceBundle,
  changeLanguage,
  getI18n,
  hasNamespace,
  initClientI18n,
} from './client'

// Configuration
export { getClientConfig, getServerConfig, i18nConfig } from './config'
// Router context
export { createI18nContext, type I18nRouterContext, loadI18nNamespaces } from './context'
// React hooks
export { useAvailableLocales, useI18nContext, useLocale, useTranslation } from './hooks'
// SEO utilities
export { getCanonicalUrl, HreflangTags } from './seo'
// Server utilities
export {
  createServerI18n,
  detectLanguage,
  getLocaleCookieHeader,
  getLocaleFromCookie,
  getLocaleFromHeader,
  getLocaleFromPath,
  isValidLocale,
  loadTranslations,
} from './server'
export {
  DEFAULT_LOCALE,
  DEFAULT_NAMESPACE,
  type DetectedLanguage,
  type FormatOptions,
  type LanguageDetectionSource,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  type Locale,
  type LocaleContext,
  NAMESPACES,
  type Namespace,
  type TranslationResources,
} from './types'
