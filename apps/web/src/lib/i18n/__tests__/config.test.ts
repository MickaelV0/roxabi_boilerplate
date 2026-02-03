import { describe, expect, it } from 'vitest'
import { getClientConfig, getServerConfig, i18nConfig } from '../config'
import { DEFAULT_LOCALE, DEFAULT_NAMESPACE, LOCALES, NAMESPACES } from '../types'

describe('i18nConfig', () => {
  it('has correct supported languages', () => {
    expect(i18nConfig.supportedLngs).toEqual([...LOCALES])
  })

  it('has correct fallback language', () => {
    expect(i18nConfig.fallbackLng).toBe(DEFAULT_LOCALE)
  })

  it('has correct default namespace', () => {
    expect(i18nConfig.defaultNS).toBe(DEFAULT_NAMESPACE)
  })

  it('has all namespaces configured', () => {
    expect(i18nConfig.ns).toEqual([...NAMESPACES])
  })

  it('disables escape for React', () => {
    expect(i18nConfig.interpolation?.escapeValue).toBe(false)
  })
})

describe('getServerConfig', () => {
  it('returns config with specified locale', () => {
    const config = getServerConfig('fr')
    expect(config.lng).toBe('fr')
  })

  it('includes base config settings', () => {
    const config = getServerConfig('en')
    expect(config.supportedLngs).toEqual([...LOCALES])
    expect(config.fallbackLng).toBe(DEFAULT_LOCALE)
  })

  it('sets initImmediate to false for SSR', () => {
    const config = getServerConfig('en')
    expect(config.initImmediate).toBe(false)
  })
})

describe('getClientConfig', () => {
  it('returns config with specified locale', () => {
    const config = getClientConfig('fr')
    expect(config.lng).toBe('fr')
  })

  it('includes base config settings', () => {
    const config = getClientConfig('en')
    expect(config.supportedLngs).toEqual([...LOCALES])
    expect(config.fallbackLng).toBe(DEFAULT_LOCALE)
  })

  it('configures react bindings for client', () => {
    const config = getClientConfig('en')
    expect(config.react?.bindI18n).toBeDefined()
    expect(config.react?.bindI18nStore).toBeDefined()
  })
})
