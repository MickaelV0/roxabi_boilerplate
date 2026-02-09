import { expect, test } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load the landing page with correct content', async ({ page }) => {
    await page.goto('/')

    // Verify hero badge
    await expect(page.getByText('Open-Source SaaS Boilerplate')).toBeVisible()

    // Verify hero title
    await expect(page.getByText('Skip the infrastructure.')).toBeVisible()

    // Verify CTA buttons exist
    await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'GitHub' }).first()).toBeVisible()
  })

  test('should display feature cards', async ({ page }) => {
    await page.goto('/')

    // Verify feature section
    await expect(page.getByText('Everything you need to ship')).toBeVisible()

    // Verify feature cards
    await expect(page.getByText('Full-Stack TypeScript')).toBeVisible()
    await expect(page.getByText('Auth & Users')).toBeVisible()
    await expect(page.getByText('AI-Powered Dev', { exact: true })).toBeVisible()
  })

  test('should have working header navigation', async ({ page }) => {
    await page.goto('/')

    // Verify header is visible
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Verify logo/brand link
    await expect(page.getByRole('link', { name: 'Roxabi' })).toBeVisible()

    // Verify docs link in header
    await expect(header.getByRole('link', { name: /docs/i }).first()).toBeVisible()
  })

  test('should navigate to docs from Get Started button', async ({ page }) => {
    await page.goto('/')

    // Click Get Started CTA
    await page.getByRole('link', { name: 'Get Started' }).first().click()

    // Verify navigation to docs
    await expect(page).toHaveURL(/\/docs/)
  })

  test('should have a footer with links', async ({ page }) => {
    await page.goto('/')

    // Verify footer content
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.getByText('Roxabi')).toBeVisible()
    await expect(footer.getByRole('link', { name: 'GitHub' })).toBeVisible()
  })
})
