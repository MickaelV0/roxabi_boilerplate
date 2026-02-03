export const baseConfig = {
  globals: true,
  passWithNoTests: true,
  watch: false,
  reporters: ['default'],
  testTimeout: 10000,
}

export const reactConfig = {
  ...baseConfig,
  environment: 'jsdom' as const,
  include: ['src/**/*.test.{ts,tsx}'],
  exclude: ['**/e2e/**', '**/node_modules/**'],
  css: false,
}

export const nodeConfig = {
  ...baseConfig,
  environment: 'node' as const,
  include: ['src/**/*.test.ts'],
}
