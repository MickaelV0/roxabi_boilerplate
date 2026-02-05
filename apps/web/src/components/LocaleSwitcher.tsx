// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale

import { m } from '@/paraglide/messages'
import { getLocale, locales, setLocale } from '@/paraglide/runtime'

export function LocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <nav className="flex gap-2 items-center" aria-label={m.language_label()}>
      <span className="opacity-85">{m.current_locale({ locale: currentLocale })}</span>
      <div className="flex gap-1">
        {locales.map((locale) => (
          <button
            type="button"
            key={locale}
            onClick={() => setLocale(locale)}
            aria-pressed={locale === currentLocale}
            className={`cursor-pointer px-3 py-1.5 rounded-full border border-gray-300 tracking-tight ${
              locale === currentLocale
                ? 'bg-slate-900 text-slate-50 font-bold'
                : 'bg-transparent font-medium'
            }`}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    </nav>
  )
}
