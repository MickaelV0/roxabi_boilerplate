import { useCallback, useMemo } from 'react'
import { useTranslation as useI18nextTranslation } from 'react-i18next'
import {
  DEFAULT_LOCALE,
  type FormatOptions,
  type Locale,
  type LocaleContext,
  type Namespace,
} from './types'

/**
 * Hook to access translation functions
 * Re-export from react-i18next with proper typing
 */
export function useTranslation(ns?: Namespace | Namespace[]) {
  return useI18nextTranslation(ns)
}

/**
 * Hook to get the current locale and formatting utilities
 */
export function useLocale(): LocaleContext {
  const { i18n } = useI18nextTranslation()
  const locale = (i18n.language as Locale) || DEFAULT_LOCALE

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

  return useMemo(() => {
    const supportedLngs = i18n.options.supportedLngs
    const locales = Array.isArray(supportedLngs)
      ? supportedLngs.filter((lng): lng is Locale => lng !== 'cimode')
      : []

    return {
      currentLocale: i18n.language as Locale,
      availableLocales: locales,
    }
  }, [i18n.language, i18n.options.supportedLngs])
}
