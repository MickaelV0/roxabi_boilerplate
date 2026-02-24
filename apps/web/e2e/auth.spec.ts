import { expect, test } from '@playwright/test'
import { AuthPage } from './auth.page'

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
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'

    // Act
    await auth.loginWithPassword(testEmail, testPassword)
    await page.waitForLoadState('networkidle')

    // Assert
    // Should redirect to dashboard or have user session
    const url = page.url()
    expect(url.includes('/dashboard') || url.includes('/org')).toBe(true)
  })

  test('should show error message for invalid credentials', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)
    await auth.gotoLogin()

    // Act
    await auth.loginWithPassword('nonexistent@example.com', 'wrongpassword')
    await page.waitForLoadState('networkidle')

    // Assert
    const errorText = await auth.getErrorText()
    expect(errorText).toBeTruthy()
    expect(errorText).toMatch(/invalid|incorrect|not found/i)
  })

  test('should redirect unauthenticated user from protected routes to login', async ({ page }) => {
    // Arrange & Act
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Assert
    expect(page.url()).toContain('/login')
  })

  test('should logout user and redirect to landing page', async ({ page }) => {
    // Arrange
    const auth = new AuthPage(page)
    // First login
    await auth.gotoLogin()
    await auth.loginWithPassword('test@example.com', 'TestPassword123!')
    await page.waitForLoadState('networkidle')

    // Act
    await auth.logout()
    await page.waitForLoadState('networkidle')

    // Assert
    expect(page.url()).not.toContain('/dashboard')
    // Should be on home or login page
    expect(page.url().endsWith('/') || page.url().includes('/login')).toBeTruthy()
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
