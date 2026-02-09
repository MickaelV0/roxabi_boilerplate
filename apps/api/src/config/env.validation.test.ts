import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { validate } from './env.validation.js'

// Note: enableImplicitConversion in class-transformer relies on emitDecoratorMetadata
// to coerce strings to numbers. Vitest uses esbuild which doesn't emit decorator metadata,
// so PORT must be passed as a number in tests. In the real NestJS app (compiled with tsc),
// string-to-number coercion works automatically.

describe('env validation', () => {
  it('should pass with valid config', () => {
    const result = validate({
      NODE_ENV: 'development',
      PORT: 3001,
      CORS_ORIGIN: 'http://localhost:3000',
      LOG_LEVEL: 'debug',
    })

    expect(result.NODE_ENV).toBe('development')
    expect(result.PORT).toBe(3001)
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000')
    expect(result.LOG_LEVEL).toBe('debug')
  })

  it('should apply defaults for missing optional values', () => {
    const result = validate({})

    expect(result.NODE_ENV).toBe('development')
    expect(result.PORT).toBe(3001)
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000')
    expect(result.LOG_LEVEL).toBe('debug')
    expect(result.DATABASE_URL).toBeUndefined()
  })

  it('should accept all valid NODE_ENV values', () => {
    for (const env of ['development', 'production', 'test']) {
      const result = validate({ NODE_ENV: env })
      expect(result.NODE_ENV).toBe(env)
    }
  })

  it('should throw on invalid NODE_ENV', () => {
    expect(() => validate({ NODE_ENV: 'staging' })).toThrow()
  })

  it('should throw on invalid PORT type', () => {
    expect(() => validate({ PORT: 'abc' })).toThrow()
  })

  it('should accept DATABASE_URL when provided', () => {
    const result = validate({ DATABASE_URL: 'postgres://localhost:5432/test' })
    expect(result.DATABASE_URL).toBe('postgres://localhost:5432/test')
  })

  it('should accept a numeric PORT', () => {
    const result = validate({ PORT: 8080 })
    expect(result.PORT).toBe(8080)
  })
})
