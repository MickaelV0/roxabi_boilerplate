import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

/**
 * Base Playwright configuration for the monorepo.
 *
 * IMPORTANT: This config uses paths relative to the repository root.
 * It must be consumed from a config file at the repo root (e.g., playwright.config.ts).
 * Importing from a non-root config file will cause path resolution errors.
 */
export const basePlaywrightConfig: PlaywrightTestConfig = {
  testDir: './apps/web/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
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
  webServer: {
    command: process.env.CI ? 'node apps/web/.output/server/index.mjs' : 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}
