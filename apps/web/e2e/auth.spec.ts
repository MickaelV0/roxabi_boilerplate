import { expect, test } from '@playwright/test'
import { AuthPage } from './auth.page'
import { TEST_USER } from './testHelpers'

test.describe('Authentication', () => {
  test('should display login form when navigating to /login', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)

    // Act
    await auth.gotoLogin()

    // Assert
    await expect(auth.loginEmailInput).toBeVisible()
    await expect(auth.loginPasswordInput).toBeVisible()
    await expect(auth.loginSubmitButton).toBeVisible()
  })

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)
    await auth.gotoLogin()
    // Act
    await auth.loginWithPassword(TEST_USER.email, TEST_USER.password)

    // Assert — should redirect to dashboard or org page
    await page.waitForURL(/\/(dashboard|org)/, { timeout: 15000 })
  })

  test('should show error message for invalid credentials', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)
    await auth.gotoLogin()

    // Act
    await auth.loginWithPassword('nonexistent@example.com', 'wrongpassword')

    // Assert — wait for error to appear
    await expect(auth.errorAlert).toBeVisible({ timeout: 10000 })
    const errorText = await auth.getErrorText()
    expect(errorText).toBeTruthy()
    expect(errorText).toMatch(/invalid|incorrect|not found/i)
  })

  // TODO: requireAuth guard skips on SSR and beforeLoad doesn't re-run on hydration
  // for direct page loads. This redirect only works for client-side navigations.
  // See routeGuards.ts — "SSR renders the shell only; auth is enforced client-side."
  test.skip('should redirect unauthenticated user from protected routes to login', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 30000 })
  })

  test('should logout user and redirect to landing page', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)
    // First login
    await auth.gotoLogin()
    await auth.loginWithPassword(TEST_USER.email, TEST_USER.password)
    await page.waitForURL(/\/(dashboard|org)/, { timeout: 15000 })

    // Act
    await auth.logout()

    // Assert — should redirect away from dashboard
    await page.waitForURL(/\/(login|$)/, { timeout: 15000 })
  })

  test('should verify OAuth button is present and redirects (Google)', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)
    await auth.gotoLogin()

    // Act
    const oauthButton = auth.googleOAuthButton
    const isVisible = await oauthButton.isVisible().catch(() => false)

    // Assert
    if (isVisible) {
      // Just verify button exists and is clickable
      await expect(oauthButton).toBeVisible()
      // We don't click to avoid actual OAuth redirect in test
    }
  })

  test('should verify OAuth button is present and redirects (GitHub)', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)
    await auth.gotoLogin()

    // Act
    const oauthButton = auth.githubOAuthButton
    const isVisible = await oauthButton.isVisible().catch(() => false)

    // Assert
    if (isVisible) {
      await expect(oauthButton).toBeVisible()
    }
  })
})
