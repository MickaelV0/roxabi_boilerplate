import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model for Dashboard and authenticated navigation.
 *
 * Encapsulates dashboard-specific locators and navigation patterns.
 */
export class DashboardPage {
  constructor(private page: Page) {}

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto('/dashboard')
  }

  // ---------------------------------------------------------------------------
  // Sidebar / Navigation
  // ---------------------------------------------------------------------------

  get sidebar(): Locator {
    return this.page.locator('nav, [role="navigation"]').first()
  }

  get sidebarLinks(): Locator {
    return this.sidebar.getByRole('link')
  }

  async getNavLinkByName(name: string | RegExp): Promise<Locator> {
    return this.sidebar.getByRole('link', { name }).first()
  }

  async clickNavLink(label: string | RegExp) {
    const link = await this.getNavLinkByName(label)
    await link.click()
  }

  // ---------------------------------------------------------------------------
  // Main Content
  // ---------------------------------------------------------------------------

  get mainContent(): Locator {
    return this.page.locator('main, [role="main"]').first()
  }

  get pageHeading(): Locator {
    return this.mainContent.getByRole('heading', { level: 1 }).first()
  }

  // ---------------------------------------------------------------------------
  // Session / User Info
  // ---------------------------------------------------------------------------

  get userMenu(): Locator {
    return this.page.getByRole('button', { name: /profile|account|user|menu/i }).first()
  }

  get userEmail(): Locator {
    return this.page.getByText(/@/).first()
  }

  // ---------------------------------------------------------------------------
  // Route Verification
  // ---------------------------------------------------------------------------

  async getCurrentPath(): Promise<string> {
    return this.page.url()
  }

  async waitForRouteChange(expectedPath: RegExp | string) {
    await this.page.waitForURL(
      typeof expectedPath === 'string' ? new RegExp(expectedPath) : expectedPath
    )
  }

  async isOnPath(path: string | RegExp): Promise<boolean> {
    const url = await this.getCurrentPath()
    return typeof path === 'string' ? url.includes(path) : path.test(url)
  }
}
