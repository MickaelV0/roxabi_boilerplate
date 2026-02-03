import { useRouteContext } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import type { I18nRouterContext } from './context'
import {
  DEFAULT_LOCALE,
  type FormatOptions,
  type Locale,
  type LocaleContext,
  type Namespace,
} from './types'

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

/**
 * Hook to access translation functions
 * Uses router context for SSR, falls back to i18next on client
 */
export function useTranslation(ns?: Namespace | Namespace[]) {
  const i18nextResult = useI18nextTranslation(ns)

  // Try to get context from router for SSR
  let routerContext: { i18n?: I18nRouterContext } | undefined
  try {
    routerContext = useRouteContext({ strict: false }) as { i18n?: I18nRouterContext } | undefined
  } catch {
    // Context not available, use i18next
  }

  const namespace = Array.isArray(ns) ? ns[0] : ns

  // Create a translation function that checks router context first
  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      // Try router context first (for SSR)
      if (routerContext?.i18n?.resources && namespace) {
        const nsResources = routerContext.i18n.resources[namespace]
        if (nsResources) {
          const value = getNestedValue(nsResources as Record<string, unknown>, key)
          if (typeof value === 'string') {
            return value
          }
        }
      }

      // Fall back to i18next (for client-side after hydration)
      const result = defaultValue ? i18nextResult.t(key, defaultValue) : i18nextResult.t(key)
      return typeof result === 'string' ? result : (defaultValue ?? key)
    },
    [routerContext?.i18n?.resources, namespace, i18nextResult.t]
  )

  return {
    ...i18nextResult,
    t,
  }
}

/**
 * Hook to get the current locale and formatting utilities
 */
export function useLocale(): LocaleContext {
  const { i18n } = useI18nextTranslation()

  // Try to get locale from router context for SSR
  let routerContext: { i18n?: I18nRouterContext } | undefined
  try {
    routerContext = useRouteContext({ strict: false }) as { i18n?: I18nRouterContext } | undefined
  } catch {
    // Context not available
  }

  const locale =
    (routerContext?.i18n?.locale as Locale) || (i18n.language as Locale) || DEFAULT_LOCALE

  const formatDate = useCallback(
    (date: Date, options?: FormatOptions): string => {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: options?.dateStyle,
        timeStyle: options?.timeStyle,
      }).format(date)
    },
    [locale]
  )

  const formatNumber = useCallback(
    (value: number, options?: FormatOptions): string => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits,
      }).format(value)
    },
    [locale]
  )

  const formatCurrency = useCallback(
    (value: number, currency = 'EUR'): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(value)
    },
    [locale]
  )

  return useMemo(
    () => ({
      locale,
      formatDate,
      formatNumber,
      formatCurrency,
    }),
    [locale, formatDate, formatNumber, formatCurrency]
  )
}

/**
 * Hook to get available locales for language switcher
 */
export function useAvailableLocales() {
  const { i18n } = useI18nextTranslation()

  // Try to get locale from router context for SSR
  let routerContext: { i18n?: I18nRouterContext } | undefined
  try {
    routerContext = useRouteContext({ strict: false }) as { i18n?: I18nRouterContext } | undefined
  } catch {
    // Context not available
  }

  return useMemo(() => {
    // Handle SSR case where i18n may not be fully initialized
    const supportedLngs = i18n.options?.supportedLngs
    const locales = Array.isArray(supportedLngs)
      ? supportedLngs.filter((lng): lng is Locale => lng !== 'cimode')
      : (['en', 'fr'] as Locale[]) // Fallback to known locales

    const currentLocale =
      (routerContext?.i18n?.locale as Locale) || (i18n.language as Locale) || DEFAULT_LOCALE

    return {
      currentLocale,
      availableLocales: locales,
    }
  }, [i18n.language, i18n.options?.supportedLngs, routerContext?.i18n?.locale])
}
