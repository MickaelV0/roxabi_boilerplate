export const baseConfig = {
  passWithNoTests: false,
  watch: false,
  reporters: ['default'],
  testTimeout: 10000,
  coverage: {
    provider: 'v8' as const,
    reporter: ['text', 'json', 'html'],
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
      autoUpdate: true,
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/test/**',
      '**/__tests__/**',
      '**/e2e/**',
      '**/*.d.ts',
      '**/vitest.config.*',
    ],
  },
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
