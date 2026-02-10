import { describe, expect, it } from 'vitest'

import { extractCorrelationId } from './correlation-id.util.js'

describe('extractCorrelationId', () => {
  it('should return undefined for undefined header', () => {
    expect(extractCorrelationId(undefined)).toBeUndefined()
  })

  it('should return undefined for empty string', () => {
    expect(extractCorrelationId('')).toBeUndefined()
  })

  it('should return undefined for whitespace-only string', () => {
    expect(extractCorrelationId('   ')).toBeUndefined()
  })

  it('should return a valid UUID header as-is', () => {
    expect(extractCorrelationId('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    )
  })

  it('should return a valid alphanumeric header', () => {
    expect(extractCorrelationId('abc_123-def')).toBe('abc_123-def')
  })

  it('should use the first element of an array header', () => {
    expect(extractCorrelationId(['first-id', 'second-id'])).toBe('first-id')
  })

  it('should return undefined for an empty array', () => {
    expect(extractCorrelationId([])).toBeUndefined()
  })

  it('should use the first value from comma-separated headers', () => {
    expect(extractCorrelationId('first-id,second-id')).toBe('first-id')
  })

  it('should trim whitespace from the extracted value', () => {
    expect(extractCorrelationId('  my-id  ')).toBe('my-id')
  })

  it('should return undefined for headers with control characters', () => {
    expect(extractCorrelationId('bad\nvalue')).toBeUndefined()
  })

  it('should return undefined for headers with HTML', () => {
    expect(extractCorrelationId('<script>alert(1)</script>')).toBeUndefined()
  })

  it('should return undefined for headers exceeding 128 characters', () => {
    const long = 'a'.repeat(129)
    expect(extractCorrelationId(long)).toBeUndefined()
  })

  it('should accept a header at exactly 128 characters', () => {
    const exact = 'a'.repeat(128)
    expect(extractCorrelationId(exact)).toBe(exact)
  })
})
