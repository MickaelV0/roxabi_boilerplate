import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model for Auth flows (login, signup, logout).
 *
 * Encapsulates locators and navigation for authentication pages.
 */
export class AuthPage {
  constructor(private page: Page) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Wait for React hydration to complete.
   * TanStack Start SSR renders the HTML, but event handlers (e.g. e.preventDefault())
   * are only attached after React hydrates. Interacting before hydration causes
   * plain HTML form submits instead of JS-handled ones.
   */
  private async waitForHydration() {
    await this.page.waitForFunction(
      () => {
        const btn = document.querySelector('button[type="submit"]')
        if (!btn) return false
        // React attaches __reactFiber$ / __reactProps$ to DOM nodes during hydration
        return Object.keys(btn).some((k) => k.startsWith('__react'))
      },
      { timeout: 15000 }
    )
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async gotoLogin() {
    await this.page.goto('/login')
    await this.waitForHydration()
  }

  async gotoSignup() {
    await this.page.goto('/signup')
    await this.waitForHydration()
  }

  // ---------------------------------------------------------------------------
  // Login Tab — Password
  // ---------------------------------------------------------------------------

  get loginEmailInput(): Locator {
    return this.page.getByLabel(/email/i).first()
  }

  get loginPasswordInput(): Locator {
    return this.page.locator('input#password')
  }

  get loginSubmitButton(): Locator {
    return this.page.getByRole('button', { name: /sign in|submit/i }).first()
  }

  async loginWithPassword(email: string, password: string) {
    await this.loginEmailInput.fill(email)
    await this.loginPasswordInput.fill(password)
    await this.loginSubmitButton.click()
  }

  // ---------------------------------------------------------------------------
  // Signup
  // ---------------------------------------------------------------------------

  get signupEmailInput(): Locator {
    return this.page.getByLabel(/email/i).first()
  }

  get signupPasswordInput(): Locator {
    return this.page.locator('input#password')
  }

  get signupNameInput(): Locator {
    return this.page.getByLabel(/name/i, { exact: false }).first()
  }

  get signupSubmitButton(): Locator {
    return this.page.getByRole('button', { name: /sign up|create|register/i }).first()
  }

  async signup(email: string, password: string, name?: string) {
    if (name) {
      await this.signupNameInput.fill(name)
    }
    await this.signupEmailInput.fill(email)
    await this.signupPasswordInput.fill(password)
    await this.signupSubmitButton.click()
  }

  // ---------------------------------------------------------------------------
  // OAuth
  // ---------------------------------------------------------------------------

  get googleOAuthButton(): Locator {
    return this.page.getByRole('button', { name: /google/i }).first()
  }

  get githubOAuthButton(): Locator {
    return this.page.getByRole('button', { name: /github/i }).first()
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  get userMenuTrigger(): Locator {
    return this.page.getByRole('button', { name: /user menu/i })
  }

  get logoutButton(): Locator {
    return this.page.getByRole('menuitem', { name: /sign out/i })
  }

  async logout() {
    await this.userMenuTrigger.click()
    await this.logoutButton.click()
  }

  // ---------------------------------------------------------------------------
  // Error Messages
  // ---------------------------------------------------------------------------

  get errorAlert(): Locator {
    return this.page.getByRole('alert').first()
  }

  async getErrorText(): Promise<string | null> {
    const error = this.errorAlert
    return error.isVisible().then(() => error.textContent())
  }

  // ---------------------------------------------------------------------------
  // Navigation (after login)
  // ---------------------------------------------------------------------------

  get dashboardLink(): Locator {
    return this.page.getByRole('link', { name: /dashboard/i }).first()
  }
}
