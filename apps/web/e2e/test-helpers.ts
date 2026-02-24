import type { Page } from '@playwright/test'
import { AuthPage } from './auth.page'

/**
 * Shared test utilities for E2E tests.
 * Provides helper functions for common test operations.
 */

/**
 * Test user credentials for E2E tests
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
}

export const TEST_USER_2 = {
  email: 'test2@example.com',
  password: 'TestPassword456!',
  name: 'Another User',
}

/**
 * Login a user in E2E tests
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 */
export async function loginUser(
  page: Page,
  email: string = TEST_USER.email,
  password: string = TEST_USER.password
) {
  const auth = new AuthPage(page)
  await auth.gotoLogin()
  await auth.loginWithPassword(email, password)
  await page.waitForLoadState('networkidle')
  return auth
}

/**
 * Logout a user in E2E tests
 * @param page - Playwright page object
 */
export async function logoutUser(page: Page) {
  const auth = new AuthPage(page)
  await auth.logout()
  await page.waitForLoadState('networkidle')
}

/**
 * Check if user is authenticated (basic check)
 * @param page - Playwright page object
 * @returns true if user appears authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url()
  // User is authenticated if NOT on login page
  return !url.includes('/login')
}

/**
 * Clear session cookies
 * @param page - Playwright page object
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies()
  await page.goto('/')
}

/**
 * Wait for navigation to a specific path
 * @param page - Playwright page object
 * @param pathPattern - Path pattern to match (regex or string)
 */
export async function waitForNavigation(page: Page, pathPattern: string | RegExp) {
  await page.waitForURL(
    typeof pathPattern === 'string' ? new RegExp(pathPattern) : pathPattern
  )
}

/**
 * Get current user email from page (if displayed)
 * @param page - Playwright page object
 * @returns User email if visible, null otherwise
 */
export async function getUserEmail(page: Page): Promise<string | null> {
  try {
    const emailElement = await page.getByText(/@/).first()
    return (await emailElement.textContent()) || null
  } catch {
    return null
  }
}
