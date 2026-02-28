import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model for the Registration page (/register).
 *
 * Encapsulates locators and navigation for the registration flow.
 * No assertions inside this class — tests assert on the returned values.
 */
export class RegistrationPage {
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

  async goto() {
    await this.page.goto('/register')
    await this.waitForHydration()
  }

  // ---------------------------------------------------------------------------
  // Form inputs
  // ---------------------------------------------------------------------------

  get nameInput(): Locator {
    return this.page.locator('input#name')
  }

  get emailInput(): Locator {
    return this.page.locator('input#email')
  }

  get passwordInput(): Locator {
    return this.page.locator('input#password')
  }

  get acceptTermsCheckbox(): Locator {
    return this.page.locator('input#accept-terms, button#accept-terms').first()
  }

  get submitButton(): Locator {
    return this.page
      .getByRole('button', { name: /create account|sign up|register|creating/i })
      .first()
  }

  // ---------------------------------------------------------------------------
  // Post-submit elements
  // ---------------------------------------------------------------------------

  /**
   * The success card shown after a successful registration (contains CheckCircle icon).
   * Matches the CardHeader + CardTitle inside RegistrationSuccess component.
   */
  get successCard(): Locator {
    // The success state renders a Card with a CheckCircle icon (aria-hidden) and a CardTitle
    return this.page
      .locator('[data-slot="card"]')
      .filter({ hasText: /check|verify|confirm/i })
      .first()
  }

  /**
   * Alternative success detection: look for the success title text or the back-to-sign-in link
   * which only appears in the RegistrationSuccess component.
   */
  get backToLoginLink(): Locator {
    return this.page.getByRole('link', { name: /back to sign in|sign in/i }).first()
  }

  get errorAlert(): Locator {
    return this.page.locator('[data-slot="form-message"]').first()
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Fill and submit the registration form.
   * Checks the accept-terms checkbox before submitting (required for submit to be enabled).
   */
  async register(name: string, email: string, password: string) {
    await this.nameInput.fill(name)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    // The terms checkbox must be checked for the submit button to be enabled
    const checkbox = this.page.locator('#accept-terms')
    const isChecked = await checkbox.isChecked().catch(() => false)
    if (!isChecked) {
      await checkbox.click()
    }
    await this.submitButton.click()
  }
}
