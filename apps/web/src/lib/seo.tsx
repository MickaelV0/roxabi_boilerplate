import { getLocale, locales } from '@/paraglide/runtime'

function getBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_BASE_URL

  if (!baseUrl && import.meta.env.DEV) {
    console.warn('[seo] VITE_BASE_URL not set, using fallback https://example.com')
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
      {locales.map((locale) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={`${baseUrl}/${locale}${path}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${path}`} />
    </>
  )
}

export function getCanonicalUrl(path: string): string {
  const baseUrl = getBaseUrl()
  const locale = getLocale()
  return `${baseUrl}/${locale}${path}`
}
