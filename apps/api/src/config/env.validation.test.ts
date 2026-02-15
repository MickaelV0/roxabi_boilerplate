import { describe, expect, it } from 'vitest'
import { validate } from './env.validation.js'

describe('env validation', () => {
  it('should pass with valid config', () => {
    const result = validate({
      NODE_ENV: 'development',
      PORT: 4000,
      CORS_ORIGIN: 'http://localhost:3000',
      LOG_LEVEL: 'debug',
    })

    expect(result.NODE_ENV).toBe('development')
    expect(result.PORT).toBe(4000)
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000')
    expect(result.LOG_LEVEL).toBe('debug')
  })

  it('should apply defaults for missing optional values', () => {
    const result = validate({})

    expect(result.NODE_ENV).toBe('development')
    expect(result.PORT).toBe(4000)
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000')
    expect(result.LOG_LEVEL).toBe('debug')
    expect(result.DATABASE_URL).toBeUndefined()
    expect(result.APP_URL).toBeUndefined()
  })

  it('should accept all valid NODE_ENV values', () => {
    for (const env of ['development', 'production', 'test']) {
      const result = validate({
        NODE_ENV: env,
        BETTER_AUTH_SECRET: 'a-safe-secret-for-testing-purposes',
        ...(env === 'production' && {
          UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
          UPSTASH_REDIS_REST_TOKEN: 'test-token',
        }),
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

  it('should coerce a string PORT to number', () => {
    const result = validate({ PORT: '9090' })
    expect(result.PORT).toBe(9090)
  })

  describe('APP_URL validation', () => {
    it('should accept a valid APP_URL', () => {
      const result = validate({ APP_URL: 'https://app.example.com' })
      expect(result.APP_URL).toBe('https://app.example.com')
    })

    it('should throw on invalid APP_URL', () => {
      expect(() => validate({ APP_URL: 'not-a-url' })).toThrow()
    })

    it('should allow APP_URL to be omitted', () => {
      const result = validate({})
      expect(result.APP_URL).toBeUndefined()
    })
  })

  describe('BETTER_AUTH_URL validation', () => {
    it('should default to http://localhost:4000', () => {
      const result = validate({})
      expect(result.BETTER_AUTH_URL).toBe('http://localhost:4000')
    })

    it('should throw on invalid BETTER_AUTH_URL', () => {
      expect(() => validate({ BETTER_AUTH_URL: 'not-a-url' })).toThrow()
    })
  })

  describe('BETTER_AUTH_SECRET production guard', () => {
    it('should throw when using default secret in production', () => {
      expect(() =>
        validate({
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: 'dev-secret-do-not-use-in-production',
          UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
          UPSTASH_REDIS_REST_TOKEN: 'test-token',
        })
      ).toThrow('BETTER_AUTH_SECRET must be set to a secure value in production')
    })

    it('should throw when using placeholder secret in production', () => {
      expect(() =>
        validate({
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: 'change-me-to-a-random-32-char-string',
          UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
          UPSTASH_REDIS_REST_TOKEN: 'test-token',
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
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
      })
      expect(result.BETTER_AUTH_SECRET).toBe('a-real-secret-that-is-safe-for-prod')
    })
  })

  describe('Upstash Redis production guard', () => {
    it('should throw when UPSTASH_REDIS_REST_URL is missing in production with rate limiting enabled', () => {
      expect(() =>
        validate({
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: 'a-real-secret-that-is-safe-for-prod',
          RATE_LIMIT_ENABLED: 'true',
        })
      ).toThrow('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production')
    })

    it('should throw when UPSTASH_REDIS_REST_TOKEN is missing in production with rate limiting enabled', () => {
      expect(() =>
        validate({
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: 'a-real-secret-that-is-safe-for-prod',
          RATE_LIMIT_ENABLED: 'true',
          UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        })
      ).toThrow('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production')
    })

    it('should allow missing Upstash vars in production when rate limiting is disabled', () => {
      const result = validate({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'a-real-secret-that-is-safe-for-prod',
        RATE_LIMIT_ENABLED: 'false',
      })
      expect(result.UPSTASH_REDIS_REST_URL).toBeUndefined()
      expect(result.UPSTASH_REDIS_REST_TOKEN).toBeUndefined()
    })

    it('should allow missing UPSTASH_REDIS_REST_URL in development', () => {
      const result = validate({ NODE_ENV: 'development' })
      expect(result.UPSTASH_REDIS_REST_URL).toBeUndefined()
    })

    it('should accept UPSTASH_REDIS_REST_URL when provided', () => {
      const result = validate({ UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io' })
      expect(result.UPSTASH_REDIS_REST_URL).toBe('https://redis.upstash.io')
    })
  })

  describe('rate limiting env vars', () => {
    it('should apply rate limiting defaults', () => {
      const result = validate({})
      expect(result.RATE_LIMIT_ENABLED).toBe('true')
      expect(result.RATE_LIMIT_GLOBAL_TTL).toBe(60_000)
      expect(result.RATE_LIMIT_GLOBAL_LIMIT).toBe(60)
      expect(result.RATE_LIMIT_AUTH_TTL).toBe(60_000)
      expect(result.RATE_LIMIT_AUTH_LIMIT).toBe(5)
      expect(result.RATE_LIMIT_AUTH_BLOCK_DURATION).toBe(300_000)
      expect(result.SWAGGER_ENABLED).toBeUndefined()
      expect(result.RATE_LIMIT_API_TTL).toBe(60_000)
      expect(result.RATE_LIMIT_API_LIMIT).toBe(100)
    })

    it('should accept custom rate limit values', () => {
      const result = validate({
        RATE_LIMIT_GLOBAL_LIMIT: '120',
        RATE_LIMIT_AUTH_LIMIT: '10',
      })
      expect(result.RATE_LIMIT_GLOBAL_LIMIT).toBe(120)
      expect(result.RATE_LIMIT_AUTH_LIMIT).toBe(10)
    })
  })
})
