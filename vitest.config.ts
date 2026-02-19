import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
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
        // Auth client instantiation (no logic, just config)
        '**/lib/auth-client.ts',
        // i18n infrastructure (React hooks/components - tested via integration)
        '**/lib/i18n/client.ts',
        '**/lib/i18n/context.ts',
        '**/lib/i18n/hooks.ts',
        '**/lib/i18n/seo.tsx',
        // Component files need integration tests
        '**/components/LanguageSwitcher.tsx',
        '**/vite-env.d.ts',
        // Type declaration files (including pure-type .ts files)
        '**/*.d.ts',
        '**/lib/avatar/types.ts',
        // Server entry point (infrastructure)
        '**/server.ts',
        // Generated i18n runtime (paraglide)
        '**/paraglide/**',
      ],
      // Floor values — autoUpdate will ratchet these up to actual coverage on the next non-cached run.
      // See specs/17-testing-gold-standard.mdx for rationale.
      thresholds: {
        lines: 93.02,
        functions: 90.66,
        branches: 84.28,
        statements: 92.11,
        autoUpdate: true,
      },
    },
  },
})
