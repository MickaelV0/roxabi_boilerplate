import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/paraglide/runtime', () => ({
  locales: ['en', 'fr'] as const,
  getLocale: () => 'en',
}))

import { getCanonicalUrl, HreflangTags } from './seo'

describe('getCanonicalUrl', () => {
  it('builds URL with locale and path', () => {
    expect(getCanonicalUrl('en', '/dashboard')).toBe('https://example.com/en/dashboard')
  })

  it('works with fr locale', () => {
    expect(getCanonicalUrl('fr', '/settings')).toBe('https://example.com/fr/settings')
  })

  it('handles root path', () => {
    expect(getCanonicalUrl('en', '')).toBe('https://example.com/en')
  })
})

describe('HreflangTags', () => {
  it('renders alternate links for each locale', () => {
    render(<HreflangTags path="/dashboard" />)
    const links = document.querySelectorAll('link[rel="alternate"]')

    expect(links).toHaveLength(3)
    expect(links[0]?.getAttribute('hreflang')).toBe('en')
    expect(links[0]?.getAttribute('href')).toBe('https://example.com/en/dashboard')
    expect(links[1]?.getAttribute('hreflang')).toBe('fr')
    expect(links[1]?.getAttribute('href')).toBe('https://example.com/fr/dashboard')
    expect(links[2]?.getAttribute('hreflang')).toBe('x-default')
    expect(links[2]?.getAttribute('href')).toBe('https://example.com/en/dashboard')
  })
})
