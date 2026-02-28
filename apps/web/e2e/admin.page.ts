import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model for Admin flows (org admin and system admin navigation).
 *
 * Encapsulates locators and navigation for admin pages.
 * No assertions inside this class — tests assert on the returned locators/data.
 */
export class AdminPage {
  constructor(private page: Page) {}

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goto(path = '/admin/members') {
    await this.page.goto(path)
    await this.page.waitForLoadState('domcontentloaded')
    // Wait for client-side auth guard and data fetching to settle
    await this.page.waitForTimeout(500)
  }

  async gotoMembers() {
    await this.goto('/admin/members')
  }

  async gotoSettings() {
    await this.goto('/admin/settings')
  }

  async gotoUsers() {
    await this.goto('/admin/users')
  }

  async gotoOrganizations() {
    await this.goto('/admin/organizations')
  }

  async gotoFeatureFlags() {
    await this.goto('/admin/feature-flags')
  }

  async gotoAuditLogs() {
    await this.goto('/admin/audit-logs')
  }

  async gotoSystemSettings() {
    await this.goto('/admin/system-settings')
  }

  // ---------------------------------------------------------------------------
  // Admin sidebar — navigation container
  // ---------------------------------------------------------------------------

  /**
   * The desktop admin navigation sidebar (aria-label="Admin navigation").
   * Contains both org links and system links.
   */
  get adminNav(): Locator {
    return this.page.getByRole('navigation', { name: /admin navigation/i }).first()
  }

  // ---------------------------------------------------------------------------
  // Org sidebar links (Members, Settings)
  // ---------------------------------------------------------------------------

  get membersLink(): Locator {
    return this.adminNav.getByRole('link', { name: /members/i }).first()
  }

  get settingsLink(): Locator {
    return this.adminNav.getByRole('link', { name: /settings/i }).first()
  }

  // ---------------------------------------------------------------------------
  // System sidebar links (Users, Organizations, System Settings, Feature Flags, Audit Logs)
  // ---------------------------------------------------------------------------

  get usersLink(): Locator {
    return this.adminNav.getByRole('link', { name: /^users$/i }).first()
  }

  get organizationsLink(): Locator {
    return this.adminNav.getByRole('link', { name: /organizations/i }).first()
  }

  get systemSettingsLink(): Locator {
    return this.adminNav.getByRole('link', { name: /system settings/i }).first()
  }

  get featureFlagsLink(): Locator {
    return this.adminNav.getByRole('link', { name: /feature flags/i }).first()
  }

  get auditLogsLink(): Locator {
    return this.adminNav.getByRole('link', { name: /audit logs/i }).first()
  }

  // ---------------------------------------------------------------------------
  // Members page locators
  // ---------------------------------------------------------------------------

  /**
   * The search input on the members page.
   * The component uses aria-label matching the placeholder text.
   */
  get memberSearch(): Locator {
    return this.page.getByRole('textbox', { name: /search/i }).first()
  }

  /**
   * The members table (Card containing the table/list of members).
   */
  get membersCard(): Locator {
    return this.page.getByRole('heading', { name: /active members|active/i }).first()
  }

  /**
   * Individual member rows in the table.
   */
  get memberRows(): Locator {
    return this.page.getByRole('row').filter({ hasNotText: /name|email|role/i })
  }

  // ---------------------------------------------------------------------------
  // Org settings page locators
  // ---------------------------------------------------------------------------

  /**
   * The org name input on the settings page (id="org-name").
   */
  get orgNameInput(): Locator {
    return this.page.getByLabel(/organization name|^name$/i).first()
  }

  /**
   * The org slug input on the settings page (id="org-slug").
   */
  get orgSlugInput(): Locator {
    return this.page.getByLabel(/slug/i).first()
  }

  /**
   * The page heading for settings ("Organization Settings").
   */
  get settingsHeading(): Locator {
    return this.page.getByRole('heading', { level: 1 }).first()
  }

  // ---------------------------------------------------------------------------
  // Org switcher (in Header — shows current org name and allows switching)
  // ---------------------------------------------------------------------------

  /**
   * The org switcher button in the header — shows the currently active org name.
   * The OrgSwitcher renders a ghost Button with the org name and a ChevronDown icon.
   */
  get orgSwitcherButton(): Locator {
    // The OrgSwitcher is a DropdownMenuTrigger with variant="ghost" size="sm"
    // containing the org name. We locate it by its role as a button inside the header.
    return this.page
      .locator('header')
      .getByRole('button', { name: /chevron|chev/i })
      .first()
  }

  /**
   * Get the org switcher button by the visible org name text.
   */
  orgSwitcherByName(orgName: string | RegExp): Locator {
    return this.page.locator('header').getByRole('button', { name: orgName })
  }

  /**
   * Org name as displayed in the switcher button (text content).
   */
  async getCurrentOrgName(): Promise<string | null> {
    // The OrgSwitcher renders the org name inside a ghost button in the header nav
    // alongside other header buttons. We find it by checking buttons in the header
    // that contain text (not purely icon buttons).
    const header = this.page.locator('header')
    const buttons = header.getByRole('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i)
      const text = await btn.textContent()
      // The org switcher shows the org name — skip known icon-only buttons
      if (
        text &&
        text.trim().length > 0 &&
        !text.match(/menu|theme|locale|github|sign in|sign up|open|close/i)
      ) {
        return text
          .trim()
          .replace(/[\u{203F}-\u{2040}]|[^\x20-\x7F]/gu, '')
          .trim()
      }
    }
    return null
  }

  /**
   * The dropdown menu content that appears when the org switcher is opened.
   */
  get orgDropdownMenu(): Locator {
    return this.page.getByRole('menu')
  }

  /**
   * Switch to a different org by clicking the switcher and selecting by name.
   */
  async switchOrg(orgName: string) {
    // Find and click the org switcher trigger in the header
    // The button renders the current org name text + ChevronDown
    const header = this.page.locator('header')
    const buttons = header.getByRole('button')
    const count = await buttons.count()

    let switcherBtn: Locator | null = null
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i)
      const text = await btn.textContent()
      if (
        text &&
        text.trim().length > 0 &&
        !text.match(/menu|theme|locale|github|sign in|sign up|open|close/i)
      ) {
        switcherBtn = btn
        break
      }
    }

    if (!switcherBtn) return

    await switcherBtn.click()

    // Wait for dropdown and click the target org
    const menu = this.page.getByRole('menu')
    await menu.waitFor({ state: 'visible', timeout: 5000 })
    await menu.getByRole('menuitem', { name: orgName }).click()

    // Wait for the menu to close
    await menu.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  }
}
