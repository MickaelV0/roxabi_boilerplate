import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'apps/web/vitest.config.ts',
      'apps/api/vitest.config.ts',
      'packages/ui/vitest.config.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
        '**/e2e/**',
        '**/index.ts',
        'packages/config/**',
        'packages/types/**',
        // Generated files
        '**/*.gen.ts',
        // Framework/routing files
        '**/routes/**',
        '**/__root.tsx',
        '**/router.tsx',
        // Infrastructure/boilerplate files
        '**/*-error-boundary.tsx',
        '**/not-found.tsx',
        '**/layout.shared.tsx',
        '**/source.ts',
        // NestJS bootstrap and module wiring
        '**/main.ts',
        '**/*.module.ts',
        '**/database/schema/*.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
