import { defineConfig } from '@playwright/test'
import { basePlaywrightConfig } from '@repo/playwright-config/base'

// For fast local runs, use: bun run test:e2e --project=chromium
export default defineConfig({
  ...basePlaywrightConfig,
})
