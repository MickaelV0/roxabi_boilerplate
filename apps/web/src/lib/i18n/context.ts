import { loadTranslations } from './server'
import type { Locale, Namespace } from './types'

/**
 * Serializable i18n context for router
 * Note: Does not contain functions to allow SSR serialization
 */
export type I18nRouterContext = {
  locale: Locale
  resources: Record<string, Record<string, object>>
}

/**
 * Create a new i18n context with the given locale
 */
export function createI18nContext(locale: Locale): I18nRouterContext {
  return {
    locale,
    resources: {},
  }
}

/**
 * Load translation namespaces into the context
 * This is a standalone function to avoid serialization issues with SSR
 */
export async function loadI18nNamespaces(
  context: I18nRouterContext,
  namespaces: Namespace[]
): Promise<void> {
  const loaded = await loadTranslations(context.locale, namespaces)
  Object.assign(context.resources, loaded)
}
