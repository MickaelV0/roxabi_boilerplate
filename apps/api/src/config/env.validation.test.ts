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
      const result = validate({
        NODE_ENV: env,
        BETTER_AUTH_SECRET: 'a-safe-secret-for-testing-purposes',
      })
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

  describe('BETTER_AUTH_SECRET production guard', () => {
    it('should throw when using default secret in production', () => {
      expect(() =>
        validate({
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: 'dev-secret-do-not-use-in-production',
        })
      ).toThrow('BETTER_AUTH_SECRET must be set to a secure value in production')
    })

    it('should throw when using placeholder secret in production', () => {
      expect(() =>
        validate({
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: 'change-me-to-a-random-32-char-string',
        })
      ).toThrow('BETTER_AUTH_SECRET must be set to a secure value in production')
    })

    it('should allow default secret in development', () => {
      const result = validate({ NODE_ENV: 'development' })
      expect(result.BETTER_AUTH_SECRET).toBe('dev-secret-do-not-use-in-production')
    })

    it('should allow default secret in test environment', () => {
      const result = validate({ NODE_ENV: 'test' })
      expect(result.BETTER_AUTH_SECRET).toBe('dev-secret-do-not-use-in-production')
    })

    it('should allow custom secret in production', () => {
      const result = validate({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'a-real-secret-that-is-safe-for-prod',
      })
      expect(result.BETTER_AUTH_SECRET).toBe('a-real-secret-that-is-safe-for-prod')
    })
  })
})
