import { describe, expect, it } from 'vitest'
import { redactSensitiveFields } from './redactSensitiveFields.js'

describe('redactSensitiveFields', () => {
  it('should return null for null input', () => {
    expect(redactSensitiveFields(null)).toBeNull()
  })

  it('should redact top-level sensitive fields', () => {
    const data = { name: 'Alice', password: 's3cret', email: 'a@b.com' }
    expect(redactSensitiveFields(data)).toEqual({
      name: 'Alice',
      password: '[REDACTED]',
      email: 'a@b.com',
    })
  })

  it('should redact case-insensitively', () => {
    const data = { Password: 'abc', PASSWORD_HASH: 'hash123' }
    expect(redactSensitiveFields(data)).toEqual({
      Password: '[REDACTED]',
      PASSWORD_HASH: '[REDACTED]',
    })
  })

  it('should redact nested object fields', () => {
    const data = { config: { apiKey: 'key-123', name: 'test' } }
    expect(redactSensitiveFields(data)).toEqual({
      config: { apiKey: '[REDACTED]', name: 'test' },
    })
  })

  it('should redact sensitive fields inside arrays of objects', () => {
    const data = {
      users: [
        { name: 'Alice', accessToken: 'tok-1' },
        { name: 'Bob', refreshToken: 'tok-2' },
      ],
    }
    expect(redactSensitiveFields(data)).toEqual({
      users: [
        { name: 'Alice', accessToken: '[REDACTED]' },
        { name: 'Bob', refreshToken: '[REDACTED]' },
      ],
    })
  })

  it('should preserve primitive array values', () => {
    const data = { tags: ['admin', 'active'], secret: 'x' }
    expect(redactSensitiveFields(data)).toEqual({
      tags: ['admin', 'active'],
      secret: '[REDACTED]',
    })
  })

  it('should handle deeply nested structures', () => {
    const data = {
      level1: {
        level2: {
          clientSecret: 'deep-secret',
          safe: 'value',
        },
      },
    }
    expect(redactSensitiveFields(data)).toEqual({
      level1: {
        level2: {
          clientSecret: '[REDACTED]',
          safe: 'value',
        },
      },
    })
  })

  it('should handle empty objects and arrays', () => {
    const data = { empty: {}, list: [], name: 'test' }
    expect(redactSensitiveFields(data)).toEqual({
      empty: {},
      list: [],
      name: 'test',
    })
  })
})
