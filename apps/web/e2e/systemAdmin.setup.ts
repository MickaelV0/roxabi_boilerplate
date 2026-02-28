import { expect, test as setup } from '@playwright/test'
import { AuthPage } from './auth.page'
import { SUPERADMIN_USER } from './testHelpers'

export const superadminAuthFile = './apps/web/e2e/.auth/superadmin.json'

/**
 * Authenticate once as a superadmin user and save the storage state (cookies +
 * localStorage) so that all system-admin test projects can skip the login UI.
 */
setup('authenticate as superadmin', async ({ page }) => {
  const auth = new AuthPage(page)
  await auth.gotoLogin()
  await auth.loginWithPassword(SUPERADMIN_USER.email, SUPERADMIN_USER.password)

  // Wait for redirect to dashboard/org — generous timeout for CI
  await page.waitForURL(/\/(dashboard|org|admin)/, { timeout: 45_000 })

  // Verify we're actually authenticated
  await expect(page).not.toHaveURL(/\/login/)

  // Save signed-in state for reuse by system-admin browser projects
  await page.context().storageState({ path: superadminAuthFile })
})
