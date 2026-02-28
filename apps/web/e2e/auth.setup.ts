import { expect, test as setup } from '@playwright/test'
import { AuthPage } from './auth.page'
import { AUTH_FILE, TEST_USER } from './testHelpers'

/**
 * Authenticate once and save the storage state (cookies + localStorage)
 * so that all dependent test projects can skip the login UI.
 */
setup('authenticate', async ({ page }) => {
  const auth = new AuthPage(page)
  await auth.gotoLogin()
  await auth.loginWithPassword(TEST_USER.email, TEST_USER.password)

  // Wait for redirect to dashboard/org — generous timeout for CI
  await page.waitForURL(/\/(dashboard|org)/, { timeout: 45_000 })

  // Verify we're actually authenticated
  await expect(page).not.toHaveURL(/\/login/)

  // Save signed-in state for reuse by other projects
  await page.context().storageState({ path: AUTH_FILE })
})
