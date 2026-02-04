import { useCallback, useMemo } from 'react'
import { getLocale } from '@/paraglide/runtime'

export function useLocaleFormatters() {
  const locale = getLocale()

  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions): string => {
      return new Intl.DateTimeFormat(locale, options).format(date)
    },
    [locale]
  )

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale, options).format(value)
    },
    [locale]
  )

  const formatCurrency = useCallback(
    (value: number, currency = 'EUR'): string => {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
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
