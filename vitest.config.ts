import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'apps/web/vitest.config.ts',
      'apps/api/vitest.config.ts',
      'packages/ui/vitest.config.ts',
      'tools/vitest.config.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
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
        // i18n infrastructure (React hooks/components - tested via integration)
        '**/lib/i18n/client.ts',
        '**/lib/i18n/context.ts',
        '**/lib/i18n/hooks.ts',
        '**/lib/i18n/seo.tsx',
        // Component files need integration tests
        '**/components/LanguageSwitcher.tsx',
        '**/vite-env.d.ts',
        // Type declaration files
        '**/*.d.ts',
        // Server entry point (infrastructure)
        '**/server.ts',
        // Generated i18n runtime (paraglide)
        '**/paraglide/**',
      ],
      thresholds: {
        lines: 90,
        functions: 86,
        branches: 76,
        statements: 90,
      },
    },
  },
})
