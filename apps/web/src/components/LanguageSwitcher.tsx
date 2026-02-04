import type { Locale } from '@/lib/i18n'
import { changeLanguage, useAvailableLocales, useTranslation } from '@/lib/i18n'

type LanguageSwitcherProps = {
  /**
   * Optional className for the container
   */
  className?: string
  /**
   * Display variant
   * - 'dropdown': Shows current language with dropdown to select others
   * - 'buttons': Shows all languages as buttons
   */
  variant?: 'dropdown' | 'buttons'
}

/**
 * Language names mapped by locale code
 */
const LANGUAGE_NAMES: Record<Locale, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  fr: { native: 'Français', english: 'French' },
}

/**
 * Language switcher component
 * Allows users to change the application language
 *
 * Note: Changing language triggers a page reload for SSR consistency
 */
export function LanguageSwitcher({ className, variant = 'dropdown' }: LanguageSwitcherProps) {
  const { t } = useTranslation('common')
  const { currentLocale, availableLocales } = useAvailableLocales()

  const handleLanguageChange = (locale: Locale) => {
    if (locale !== currentLocale) {
      changeLanguage(locale)
    }
  }

  if (variant === 'buttons') {
    return (
      <fieldset className={className} data-testid="language-switcher">
        <legend className="sr-only">{t('labels.language')}</legend>
        {availableLocales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => handleLanguageChange(locale)}
            aria-pressed={locale === currentLocale}
            aria-label={LANGUAGE_NAMES[locale].english}
            data-testid={`locale-${locale}`}
          >
            {LANGUAGE_NAMES[locale].native}
          </button>
        ))}
      </fieldset>
    )
  }

  return (
    <div className={className} data-testid="language-switcher">
      <label htmlFor="language-select" className="sr-only">
        {t('labels.language')}
      </label>
      <select
        id="language-select"
        value={currentLocale}
        onChange={(e) => handleLanguageChange(e.target.value as Locale)}
        aria-label={t('labels.language')}
        data-testid="language-select"
      >
        {availableLocales.map((locale) => (
          <option key={locale} value={locale} data-testid={`locale-${locale}`}>
            {LANGUAGE_NAMES[locale].native}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Hook to use language switcher logic without the UI
 * Useful for building custom language switcher components
 */
export function useLanguageSwitcher() {
  const { currentLocale, availableLocales } = useAvailableLocales()

  return {
    currentLocale,
    availableLocales,
    changeLanguage: (locale: Locale) => {
      if (locale !== currentLocale) {
        changeLanguage(locale)
      }
    },
    getLanguageName: (locale: Locale) => LANGUAGE_NAMES[locale],
  }
}
