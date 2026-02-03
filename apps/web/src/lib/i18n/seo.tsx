import { LOCALES, type Locale } from './types'

type HreflangTagsProps = {
  path: string
}

export function HreflangTags({ path }: HreflangTagsProps) {
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://example.com'

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
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://example.com'
  return `${baseUrl}/${locale}${path}`
}
