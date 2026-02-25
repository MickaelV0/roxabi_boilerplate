import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

/**
 * Base Playwright configuration for the monorepo.
 *
 * IMPORTANT: This config uses paths relative to the repository root.
 * It must be consumed from a config file at the repo root (e.g., playwright.config.ts).
 * Importing from a non-root config file will cause path resolution errors.
 *
 * Full-stack E2E: Both web (3000) and API (4000) servers are started.
 * - Local dev: `bun run dev` starts both services
 * - CI: Built web app + API server run separately
 */
export const basePlaywrightConfig: PlaywrightTestConfig = {
  testDir: './apps/web/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['blob'], ['list']] : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      // Web server (frontend)
      command: process.env.CI ? 'node apps/web/.output/server/index.mjs' : 'bun run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // API server (backend) — for full-stack E2E tests
      // Only start in CI or if explicitly requested (local dev uses 'bun run dev')
      command: process.env.CI ? 'node apps/api/dist/index.js' : 'bun run --cwd apps/api dev',
      url: 'http://localhost:4000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        NODE_ENV: process.env.CI ? 'production' : 'development',
      },
    },
  ],
}
