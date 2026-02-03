import { describe, expect, it } from 'vitest'
import {
  detectLanguage,
  getInvalidLocaleRedirect,
  getLocaleFromCookie,
  getLocaleFromHeader,
  getLocaleFromPath,
  isValidLocale,
  looksLikeLocale,
} from '../server'

describe('isValidLocale', () => {
  it('returns true for valid locales', () => {
    expect(isValidLocale('en')).toBe(true)
    expect(isValidLocale('fr')).toBe(true)
  })

  it('returns false for invalid locales', () => {
    expect(isValidLocale('de')).toBe(false)
    expect(isValidLocale('es')).toBe(false)
    expect(isValidLocale('')).toBe(false)
    expect(isValidLocale('EN')).toBe(false)
  })
})

describe('getLocaleFromPath', () => {
  it('extracts locale from path', () => {
    expect(getLocaleFromPath('/fr/dashboard')).toBe('fr')
    expect(getLocaleFromPath('/en/settings')).toBe('en')
    expect(getLocaleFromPath('/fr')).toBe('fr')
  })

  it('returns null for invalid locale in path', () => {
    expect(getLocaleFromPath('/de/dashboard')).toBe(null)
    expect(getLocaleFromPath('/dashboard')).toBe(null)
    expect(getLocaleFromPath('/')).toBe(null)
  })

  it('handles paths without locale', () => {
    expect(getLocaleFromPath('/dashboard/settings')).toBe(null)
    expect(getLocaleFromPath('/api/users')).toBe(null)
  })
})

describe('getLocaleFromCookie', () => {
  it('extracts locale from cookie header', () => {
    expect(getLocaleFromCookie('locale=fr')).toBe('fr')
    expect(getLocaleFromCookie('locale=en')).toBe('en')
    expect(getLocaleFromCookie('other=value; locale=fr; another=test')).toBe('fr')
  })

  it('returns null for missing or invalid cookie', () => {
    expect(getLocaleFromCookie(null)).toBe(null)
    expect(getLocaleFromCookie('')).toBe(null)
    expect(getLocaleFromCookie('other=value')).toBe(null)
    expect(getLocaleFromCookie('locale=de')).toBe(null)
  })

  it('handles whitespace in cookie header', () => {
    expect(getLocaleFromCookie('  locale=fr  ')).toBe('fr')
    expect(getLocaleFromCookie('other=value;  locale=fr  ;another=test')).toBe('fr')
  })
})

describe('getLocaleFromHeader', () => {
  it('extracts locale from Accept-Language header', () => {
    expect(getLocaleFromHeader('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr')
    expect(getLocaleFromHeader('en-US,en;q=0.9')).toBe('en')
    expect(getLocaleFromHeader('fr')).toBe('fr')
  })

  it('respects quality values', () => {
    expect(getLocaleFromHeader('de;q=0.9,fr;q=1.0,en;q=0.8')).toBe('fr')
    expect(getLocaleFromHeader('de;q=0.9,en;q=0.8')).toBe('en')
  })

  it('returns null for missing or unsupported languages', () => {
    expect(getLocaleFromHeader(null)).toBe(null)
    expect(getLocaleFromHeader('')).toBe(null)
    expect(getLocaleFromHeader('de-DE,de;q=0.9')).toBe(null)
    expect(getLocaleFromHeader('es,it,pt')).toBe(null)
  })

  it('handles complex Accept-Language headers', () => {
    expect(getLocaleFromHeader('de-CH,de;q=0.9,fr-FR;q=0.8,en;q=0.7')).toBe('fr')
    expect(getLocaleFromHeader('zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('en')
  })
})

describe('detectLanguage', () => {
  it('prioritizes path over other sources', () => {
    const result = detectLanguage('/fr/dashboard', 'locale=en', 'en-US')
    expect(result.locale).toBe('fr')
    expect(result.source).toBe('path')
  })

  it('falls back to cookie when path has no locale', () => {
    const result = detectLanguage('/dashboard', 'locale=fr', 'en-US')
    expect(result.locale).toBe('fr')
    expect(result.source).toBe('cookie')
  })

  it('falls back to header when no path or cookie', () => {
    const result = detectLanguage('/dashboard', null, 'fr-FR,en;q=0.8')
    expect(result.locale).toBe('fr')
    expect(result.source).toBe('header')
  })

  it('falls back to default when no source available', () => {
    const result = detectLanguage('/dashboard', null, null)
    expect(result.locale).toBe('en')
    expect(result.source).toBe('default')
  })

  it('falls back to default for invalid locales', () => {
    const result = detectLanguage('/de/dashboard', 'locale=de', 'de-DE')
    expect(result.locale).toBe('en')
    expect(result.source).toBe('default')
  })
})

describe('looksLikeLocale', () => {
  it('returns true for 2-letter codes', () => {
    expect(looksLikeLocale('en')).toBe(true)
    expect(looksLikeLocale('fr')).toBe(true)
    expect(looksLikeLocale('de')).toBe(true)
    expect(looksLikeLocale('ES')).toBe(true)
  })

  it('returns false for non-locale strings', () => {
    expect(looksLikeLocale('')).toBe(false)
    expect(looksLikeLocale('e')).toBe(false)
    expect(looksLikeLocale('eng')).toBe(false)
    expect(looksLikeLocale('dashboard')).toBe(false)
    expect(looksLikeLocale('docs')).toBe(false)
    expect(looksLikeLocale('api')).toBe(false)
    expect(looksLikeLocale('123')).toBe(false)
    expect(looksLikeLocale('a1')).toBe(false)
  })
})

describe('getInvalidLocaleRedirect', () => {
  it('returns redirect path for invalid locale', () => {
    expect(getInvalidLocaleRedirect('/de/dashboard')).toBe('/en/dashboard')
    expect(getInvalidLocaleRedirect('/es/settings')).toBe('/en/settings')
    expect(getInvalidLocaleRedirect('/it/profile/edit')).toBe('/en/profile/edit')
  })

  it('returns null for valid locales', () => {
    expect(getInvalidLocaleRedirect('/en/dashboard')).toBe(null)
    expect(getInvalidLocaleRedirect('/fr/settings')).toBe(null)
  })

  it('returns null for paths without locale prefix', () => {
    expect(getInvalidLocaleRedirect('/dashboard')).toBe(null)
    expect(getInvalidLocaleRedirect('/docs/api')).toBe(null)
    expect(getInvalidLocaleRedirect('/api/users')).toBe(null)
    expect(getInvalidLocaleRedirect('/')).toBe(null)
  })

  it('returns null for paths that do not look like locales', () => {
    expect(getInvalidLocaleRedirect('/dashboard/settings')).toBe(null)
    expect(getInvalidLocaleRedirect('/abc/page')).toBe(null)
    expect(getInvalidLocaleRedirect('/123/page')).toBe(null)
  })

  it('handles root-level invalid locale', () => {
    expect(getInvalidLocaleRedirect('/de')).toBe('/en')
    expect(getInvalidLocaleRedirect('/es')).toBe('/en')
  })
})
