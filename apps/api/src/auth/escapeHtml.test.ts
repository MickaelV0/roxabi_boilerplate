import { escapeHtml } from '@repo/email'
import { describe, expect, it } from 'vitest'

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b')
  })

  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('should escape double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s')
  })

  it('should not double-encode ampersands in existing entities', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })

  it('should handle a normal URL with no special characters', () => {
    expect(escapeHtml('https://example.com/reset?token=abc123')).toBe(
      'https://example.com/reset?token=abc123'
    )
  })

  it('should escape a URL containing special characters', () => {
    expect(escapeHtml('https://example.com?a=1&b=2')).toBe('https://example.com?a=1&amp;b=2')
  })

  it('should return empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })
})
