import { expect, test } from '@playwright/test'
import { ProfilePage } from './profile.page'

const hasApi = Boolean(process.env.DATABASE_URL) || !process.env.CI

test.describe('User Profile', () => {
  // Profile tests use the shared authenticated storageState from the setup project.
  // No test.use({ storageState }) override needed — the default applies.
  test.skip(() => !hasApi, 'Skipped: no DATABASE_URL in CI')

  let originalName: string

  test('should display current profile', async ({ page }) => {
    // Arrange + Act
    const profile = new ProfilePage(page)
    await profile.goto()

    // Assert — the display name input has a value (loaded from session/API)
    const nameValue = await profile.displayNameInput.inputValue()
    expect(nameValue.length).toBeGreaterThan(0)
  })

  test('should update display name', async ({ page }) => {
    // Arrange
    const profile = new ProfilePage(page)
    await profile.goto()
    originalName = await profile.displayNameInput.inputValue()
    const newName = `E2E Test ${Date.now()}`

    // Act
    await profile.updateName(newName)

    // Assert — a success toast is shown
    await expect(profile.successFeedback).toBeVisible({ timeout: 15_000 })

    // Restore original name so subsequent tests start clean
    await profile.updateName(originalName)
  })

  test('should show avatar image', async ({ page }) => {
    // Arrange + Act
    const profile = new ProfilePage(page)
    await profile.goto()

    // Assert — an <img> element for the avatar is visible
    const avatar = profile.avatarImage
    await expect(avatar).toBeVisible({ timeout: 15_000 })

    // The src attribute should be populated (DiceBear URL)
    const src = await avatar.getAttribute('src')
    expect(src).toBeTruthy()
    expect(src?.length).toBeGreaterThan(0)
  })

  test('should persist changes after reload', async ({ page }) => {
    // Arrange
    const profile = new ProfilePage(page)
    await profile.goto()
    originalName = await profile.displayNameInput.inputValue()
    const newName = `Persist-${Date.now()}`

    // Act — update name, wait for success, then reload
    await profile.updateName(newName)
    await expect(profile.successFeedback).toBeVisible({ timeout: 15_000 })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Assert — the new name is still shown after reload
    const nameAfterReload = await profile.displayNameInput.inputValue()
    expect(nameAfterReload).toBe(newName)

    // Restore original name so subsequent tests start clean
    await profile.updateName(originalName)
  })

  test.afterEach(async ({ page }) => {
    // Restore original name if it was captured and a test failed mid-way
    if (originalName) {
      try {
        const profile = new ProfilePage(page)
        await profile.goto()
        const currentName = await profile.displayNameInput.inputValue()
        if (currentName !== originalName) {
          await profile.updateName(originalName)
        }
      } catch {
        // Best-effort restore — do not fail the test on cleanup error
      }
    }
  })
})
