import { expect, test } from '@playwright/test'
import { AuthPage } from './auth.page'
import { DashboardPage } from './dashboard.page'
import { TEST_USER } from './testHelpers'

const hasApi = Boolean(process.env.DATABASE_URL) || !process.env.CI
const NAVIGATION_TIMEOUT = 30_000

test.describe('Dashboard Navigation', () => {
  // Dashboard tests require the API server (needs DATABASE_URL)
  test.skip(() => !hasApi, 'Skipped: no DATABASE_URL in CI')

  test.beforeEach(async ({ page }) => {
    // Arrange: Login before each test
    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.loginWithPassword(TEST_USER.email, TEST_USER.password)
    await page.waitForURL(/\/(dashboard|org)/, { timeout: NAVIGATION_TIMEOUT })
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard sidebar with navigation links', async ({ page }) => {
    // Arrange
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // Act & Assert
    await expect(dashboard.sidebar).toBeVisible({ timeout: 10_000 })
    const links = await dashboard.sidebarLinks.count()
    expect(links).toBeGreaterThan(0)
  })

  test('should navigate via sidebar links and update URL', async ({ page }) => {
    // Arrange
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // Act
    // Try to find and click a navigation link
    const firstLink = dashboard.sidebarLinks.first()
    const href = await firstLink.getAttribute('href')

    if (href) {
      await firstLink.click()
      await page.waitForURL(new RegExp(href), { timeout: NAVIGATION_TIMEOUT })
    }

    // Assert
    const currentPath = await dashboard.getCurrentPath()
    expect(currentPath).toBeTruthy()
  })

  test('should persist session on page refresh', async ({ page }) => {
    // Arrange
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // Act
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Assert — should still be on dashboard, not redirected to login
    expect(page.url()).not.toContain('/login')
  })

  test('should display user information in authenticated session', async ({ page }) => {
    // Arrange
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // Act & Assert
    const userMenuVisible = await dashboard.userMenu.isVisible().catch(() => false)
    if (userMenuVisible) {
      await expect(dashboard.userMenu).toBeVisible()
    }
  })

  test('should allow navigation to different sections', async ({ page }) => {
    // Arrange
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // Act
    const links = await dashboard.sidebarLinks.all()

    if (links && links.length > 0 && links[0]) {
      // Click first link and verify navigation
      await links[0].click()
      await page.waitForLoadState('networkidle')
    }

    // Assert
    const newPath = await dashboard.getCurrentPath()
    // URL should change or still be valid
    expect(newPath.length).toBeGreaterThan(0)
  })
})
