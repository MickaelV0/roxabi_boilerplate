import { expect, test } from '@playwright/test'

// TODO: Add meaningful E2E tests when UI components are implemented
// These are placeholder tests to verify Playwright setup works
test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.*/)
  })

  test('should have a visible body', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })
})
