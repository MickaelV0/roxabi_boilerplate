import { baseConfig } from './base.ts'

export const reactConfig = {
  ...baseConfig,
  environment: 'jsdom' as const,
  include: ['src/**/*.test.{ts,tsx}'],
  exclude: ['**/e2e/**', '**/node_modules/**'],
  css: false,
}
