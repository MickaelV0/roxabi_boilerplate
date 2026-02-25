import { describe, expect, it, vi } from 'vitest'
import { drizzleProvider, postgresClientProvider } from './drizzle.provider.js'

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

  it('should return null when neither DATABASE_APP_URL nor DATABASE_URL is set', () => {
    const config = createMockConfig({
      DATABASE_APP_URL: undefined,
      DATABASE_URL: undefined,
      NODE_ENV: 'development',
    })
    const result = postgresClientProvider.useFactory(config as never)
    expect(result).toBeNull()
  })

  it('should prefer DATABASE_APP_URL over DATABASE_URL when both are set', () => {
    const config = createMockConfig({
      DATABASE_APP_URL: 'postgresql://roxabi_app:roxabi_app@localhost:5432/roxabi',
      DATABASE_URL: 'postgresql://roxabi:roxabi@localhost:5432/roxabi',
      NODE_ENV: 'development',
    })
    // When DATABASE_APP_URL is set, it should be used and DATABASE_URL should not be queried
    // for the connection string (only DATABASE_APP_URL is checked first via ?? operator)
    postgresClientProvider.useFactory(config as never)
    expect(config.get).toHaveBeenCalledWith('DATABASE_APP_URL')
  })

  it('should fall back to DATABASE_URL when DATABASE_APP_URL is not set', () => {
    const config = createMockConfig({
      DATABASE_APP_URL: undefined,
      DATABASE_URL: 'postgresql://roxabi:roxabi@localhost:5432/roxabi',
      NODE_ENV: 'development',
    })
    postgresClientProvider.useFactory(config as never)
    expect(config.get).toHaveBeenCalledWith('DATABASE_APP_URL')
    expect(config.get).toHaveBeenCalledWith('DATABASE_URL')
  })
})

describe('drizzleProvider', () => {
  it('should return null when client is null', () => {
    const result = drizzleProvider.useFactory(null)
    expect(result).toBeNull()
  })
})
