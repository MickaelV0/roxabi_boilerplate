import { LOCALES, type Locale } from './types'

function getBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_BASE_URL

  if (!baseUrl && import.meta.env.DEV) {
    console.warn('[i18n/seo] VITE_BASE_URL not set, using fallback https://example.com')
  }

  return baseUrl || 'https://example.com'
}

type HreflangTagsProps = {
  path: string
}

export function HreflangTags({ path }: HreflangTagsProps) {
  const baseUrl = getBaseUrl()

  return (
    <>
      {LOCALES.map((locale) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={`${baseUrl}/${locale}${path}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${path}`} />
    </>
  )
}

export function getCanonicalUrl(locale: Locale, path: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/${locale}${path}`
}
