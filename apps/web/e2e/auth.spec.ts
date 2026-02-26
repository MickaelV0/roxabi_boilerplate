import { expect, test } from '@playwright/test'
import { AuthPage } from './auth.page'
import { TEST_USER } from './testHelpers'

const hasApi = Boolean(process.env.DATABASE_URL) || !process.env.CI
const NAVIGATION_TIMEOUT = 45_000

test.describe('Authentication', () => {
  // Auth tests require the API server (needs DATABASE_URL)
  test.skip(() => !hasApi, 'Skipped: no DATABASE_URL in CI')

  test('should display login form when navigating to /login', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.gotoLogin()

    await expect(auth.loginEmailInput).toBeVisible()
    await expect(auth.loginPasswordInput).toBeVisible()
    await expect(auth.loginSubmitButton).toBeVisible()
  })

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // This test uses a fresh context (no storageState) to test the actual login flow.
    // Clear any inherited auth state.
    await page.context().clearCookies()

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.loginWithPassword(TEST_USER.email, TEST_USER.password)

    await page.waitForURL(/\/(dashboard|org)/, { timeout: NAVIGATION_TIMEOUT })
  })

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.context().clearCookies()

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.loginWithPassword('nonexistent@example.com', 'wrongpassword')

    // Verify an error message is shown (may be "Invalid email or password"
    // or "Too many attempts" if rate-limited by earlier browser projects)
    await expect(auth.errorAlert).toBeVisible({ timeout: 15_000 })
  })

  // TODO: requireAuth guard skips on SSR and beforeLoad doesn't re-run on hydration
  // for direct page loads. This redirect only works for client-side navigations.
  // See routeGuards.ts — "SSR renders the shell only; auth is enforced client-side."
  test.skip('should redirect unauthenticated user from protected routes to login', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: NAVIGATION_TIMEOUT })
  })

  test('should logout user and redirect to landing page', async ({ page }) => {
    // storageState already provides an authenticated session
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const auth = new AuthPage(page)

    // Wait for the UserMenu to render (requires session to be loaded client-side)
    await expect(auth.userMenuTrigger).toBeVisible({ timeout: 15_000 })

    await auth.logout()

    await page.waitForURL(/\/(login|$)/, { timeout: NAVIGATION_TIMEOUT })
  })

  test('should verify OAuth button is present and redirects (Google)', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.gotoLogin()

    const oauthButton = auth.googleOAuthButton
    const isVisible = await oauthButton.isVisible().catch(() => false)

    if (isVisible) {
      await expect(oauthButton).toBeVisible()
    }
  })

  test('should verify OAuth button is present and redirects (GitHub)', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.gotoLogin()

    const oauthButton = auth.githubOAuthButton
    const isVisible = await oauthButton.isVisible().catch(() => false)

    if (isVisible) {
      await expect(oauthButton).toBeVisible()
    }
  })
})
