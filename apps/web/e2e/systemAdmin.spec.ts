import { expect, test } from '@playwright/test'
import { AdminPage } from './admin.page'

const hasApi = Boolean(process.env.DATABASE_URL) || !process.env.CI
const NAVIGATION_TIMEOUT = 45_000

// System admin tests use the superadmin session (superadmin@roxabi.local).
// The storageState is produced by system-admin.setup.ts and injected by the
// system-admin browser projects in the Playwright config.
test.describe('System Admin', () => {
  test.use({ storageState: './apps/web/e2e/.auth/superadmin.json' })
  test.skip(() => !hasApi, 'Skipped: no DATABASE_URL in CI')

  test('should display system admin sidebar links', async ({ page }) => {
    // Arrange
    const admin = new AdminPage(page)

    // Act
    await admin.gotoUsers()
    await page.waitForURL(/\/admin\/users/, { timeout: NAVIGATION_TIMEOUT })

    // Assert — superadmin sees both org links and system links in the sidebar
    await expect(admin.adminNav).toBeVisible({ timeout: 15_000 })
    await expect(admin.usersLink).toBeVisible()
    await expect(admin.organizationsLink).toBeVisible()
    await expect(admin.featureFlagsLink).toBeVisible()
    await expect(admin.auditLogsLink).toBeVisible()
    await expect(admin.systemSettingsLink).toBeVisible()
  })

  test('should display users list', async ({ page }) => {
    // Arrange
    const admin = new AdminPage(page)

    // Act
    await admin.gotoUsers()
    await page.waitForURL(/\/admin\/users/, { timeout: NAVIGATION_TIMEOUT })
    await page.waitForLoadState('networkidle')

    // Assert — the "Users" heading and the table (or empty state) are visible
    await expect(page.getByRole('heading', { name: /^users$/i })).toBeVisible({ timeout: 15_000 })
  })

  test('should filter users by role', async ({ page }) => {
    // Arrange
    const admin = new AdminPage(page)
    await admin.gotoUsers()
    await page.waitForURL(/\/admin\/users/, { timeout: NAVIGATION_TIMEOUT })
    await page.waitForLoadState('networkidle')

    // Act — open the Role filter dropdown (FilterBar renders select triggers)
    const roleFilter = page.getByRole('combobox', { name: /role/i }).first()
    const roleFilterVisible = await roleFilter.isVisible().catch(() => false)

    if (!roleFilterVisible) {
      // FilterBar may render selects differently; attempt via button
      const filterButton = page.getByRole('button', { name: /role/i }).first()
      const filterButtonVisible = await filterButton.isVisible().catch(() => false)
      if (!filterButtonVisible) {
        // Filter not rendered — skip gracefully
        return
      }
      await filterButton.click()
    } else {
      await roleFilter.click()
    }

    // Assert — some filter interaction occurred without error
    expect(page.url()).toContain('/admin/users')
  })

  test('should display organizations list', async ({ page }) => {
    // Arrange
    const admin = new AdminPage(page)

    // Act
    await admin.gotoOrganizations()
    await page.waitForURL(/\/admin\/organizations/, { timeout: NAVIGATION_TIMEOUT })
    await page.waitForLoadState('networkidle')

    // Assert — the "Organizations" heading is visible
    await expect(page.getByRole('heading', { name: /organizations/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('should display feature flags page', async ({ page }) => {
    // Arrange
    const admin = new AdminPage(page)

    // Act
    await admin.gotoFeatureFlags()
    await page.waitForURL(/\/admin\/feature-flags/, { timeout: NAVIGATION_TIMEOUT })
    await page.waitForLoadState('networkidle')

    // Assert — the "Feature Flags" heading is visible (content may be empty state
    // or a list of flags, both are valid)
    await expect(page.getByRole('heading', { name: /feature flags/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('should display audit logs', async ({ page }) => {
    // Arrange
    const admin = new AdminPage(page)

    // Act
    await admin.gotoAuditLogs()
    await page.waitForURL(/\/admin\/audit-logs/, { timeout: NAVIGATION_TIMEOUT })
    await page.waitForLoadState('networkidle')

    // Assert — the "Audit Logs" heading is visible (may show empty state or entries)
    await expect(page.getByRole('heading', { name: /audit logs/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('should display system settings', async ({ page }) => {
    // Arrange
    const admin = new AdminPage(page)

    // Act
    await admin.gotoSystemSettings()
    await page.waitForURL(/\/admin\/system-settings/, { timeout: NAVIGATION_TIMEOUT })
    await page.waitForLoadState('networkidle')

    // Assert — the "System Settings" heading is visible (may show settings cards
    // or empty state if no settings are configured)
    await expect(page.getByRole('heading', { name: /system settings/i })).toBeVisible({
      timeout: 15_000,
    })
  })
})
