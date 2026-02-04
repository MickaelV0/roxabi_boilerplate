import * as m from '@/paraglide/messages'
import { getLocale, type Locale, locales, setLocale } from '@/paraglide/runtime'

type LanguageSwitcherProps = {
  className?: string
  variant?: 'dropdown' | 'buttons'
}

const LANGUAGE_NAMES: Record<Locale, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  fr: { native: 'Français', english: 'French' },
}

export function LanguageSwitcher({ className, variant = 'dropdown' }: LanguageSwitcherProps) {
  const currentLocale = getLocale()

  const handleLanguageChange = (locale: Locale) => {
    if (locale !== currentLocale) {
      setLocale(locale)
    }
  }

  if (variant === 'buttons') {
    return (
      <fieldset className={className} data-testid="language-switcher">
        <legend className="sr-only">{m.common_labels_language()}</legend>
        {locales.map((locale) => (
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
        {m.common_labels_language()}
      </label>
      <select
        id="language-select"
        value={currentLocale}
        onChange={(e) => handleLanguageChange(e.target.value as Locale)}
        aria-label={m.common_labels_language()}
        data-testid="language-select"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale} data-testid={`locale-${locale}`}>
            {LANGUAGE_NAMES[locale].native}
          </option>
        ))}
      </select>
    </div>
  )
}

export function useLanguageSwitcher() {
  const currentLocale = getLocale()

  return {
    currentLocale,
    availableLocales: locales,
    changeLanguage: (locale: Locale) => {
      if (locale !== currentLocale) {
        setLocale(locale)
      }
    },
    getLanguageName: (locale: Locale) => LANGUAGE_NAMES[locale],
  }
}
