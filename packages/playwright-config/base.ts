import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

const hasDatabase = Boolean(process.env.DATABASE_URL)
const authFile = './apps/web/e2e/.auth/user.json'

/**
 * Base Playwright configuration for the monorepo.
 *
 * IMPORTANT: This config uses paths relative to the repository root.
 * It must be consumed from a config file at the repo root (e.g., playwright.config.ts).
 * Importing from a non-root config file will cause path resolution errors.
 *
 * Full-stack E2E: Both web (3000) and API (4000) servers are started when DATABASE_URL is set.
 * - Local dev: `bun run dev` starts both services
 * - CI with DATABASE_URL: Both servers + DB migration/seed
 * - CI without DATABASE_URL: Frontend-only (landing page tests)
 *
 * Auth strategy: A `setup` project logs in once and saves cookies to .auth/user.json.
 * Browser projects that need auth depend on `setup` and reuse the storage state.
 */
export const basePlaywrightConfig: PlaywrightTestConfig = {
  globalSetup: hasDatabase ? './apps/web/e2e/globalSetup.ts' : undefined,
  testDir: './apps/web/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: process.env.CI ? 60_000 : 30_000,
  reporter: process.env.CI ? [['blob'], ['list']] : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: process.env.CI ? 15_000 : 10_000,
  },
  projects: [
    // Setup project — authenticates once and saves state
    ...(hasDatabase
      ? [
          {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
          },
        ]
      : []),

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(hasDatabase ? { storageState: authFile } : {}),
      },
      dependencies: hasDatabase ? ['setup'] : [],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        ...(hasDatabase ? { storageState: authFile } : {}),
      },
      dependencies: hasDatabase ? ['setup'] : [],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        ...(hasDatabase ? { storageState: authFile } : {}),
      },
      dependencies: hasDatabase ? ['setup'] : [],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        ...(hasDatabase ? { storageState: authFile } : {}),
      },
      dependencies: hasDatabase ? ['setup'] : [],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: [
    {
      // Web server (frontend) — always started
      command: process.env.CI ? 'node apps/web/.output/server/index.mjs' : 'bun run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    // API server — requires DATABASE_URL (local dev always has it via .env)
    ...(hasDatabase || !process.env.CI
      ? [
          {
            command: process.env.CI ? 'node apps/api/dist/index.js' : 'bun run --cwd apps/api dev',
            url: 'http://localhost:4000/health',
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
          },
        ]
      : []),
  ],
}
