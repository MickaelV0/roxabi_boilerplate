import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/paraglide/runtime', () => ({
  getLocale: () => 'en',
}))

import { useLocale, useLocaleFormatters } from './locale-utils'

describe('useLocale', () => {
  it('returns the current locale', () => {
    const { result } = renderHook(() => useLocale())
    expect(result.current).toBe('en')
  })
})

describe('useLocaleFormatters', () => {
  it('returns the current locale', () => {
    const { result } = renderHook(() => useLocaleFormatters())
    expect(result.current.locale).toBe('en')
  })

  it('formats numbers', () => {
    const { result } = renderHook(() => useLocaleFormatters())
    const formatted = result.current.formatNumber(1234)
    expect(formatted).toBe('1,234')
  })

  it('formats currency', () => {
    const { result } = renderHook(() => useLocaleFormatters())
    const formatted = result.current.formatCurrency(99.99, 'USD')
    expect(formatted).toContain('99.99')
    expect(formatted).toContain('$')
  })

  it('formats dates', () => {
    const { result } = renderHook(() => useLocaleFormatters())
    const date = new Date('2026-01-15T12:00:00Z')
    const formatted = result.current.formatDate(date, { dateStyle: 'short' })
    expect(formatted).toBeTruthy()
  })
})
