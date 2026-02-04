import { describe, expect, it, vi } from 'vitest'
import { drizzleProvider, postgresClientProvider } from './drizzle.provider'

function createMockConfig(values: Record<string, string | undefined>) {
  return {
    get: vi.fn((key: string, defaultValue?: string) => values[key] ?? defaultValue),
  }
}

describe('postgresClientProvider', () => {
  it('should return null when DATABASE_URL is not set in non-production', () => {
    const config = createMockConfig({ DATABASE_URL: undefined, NODE_ENV: 'development' })
    const result = postgresClientProvider.useFactory(config as never)
    expect(result).toBeNull()
  })

  it('should throw when DATABASE_URL is not set in production', () => {
    const config = createMockConfig({ DATABASE_URL: undefined, NODE_ENV: 'production' })
    expect(() => postgresClientProvider.useFactory(config as never)).toThrow(
      'DATABASE_URL is required in production'
    )
  })
})

describe('drizzleProvider', () => {
  it('should return null when client is null', () => {
    const result = drizzleProvider.useFactory(null)
    expect(result).toBeNull()
  })
})
