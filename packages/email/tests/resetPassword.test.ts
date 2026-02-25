import { describe, expect, it } from 'vitest'
import { renderResetEmail } from '../src/index'

describe('renderResetEmail', () => {
  const url = 'https://app.roxabi.com/reset-password/confirm?token=abc123'

  it('should render branded HTML with CTA button in English', async () => {
    const result = await renderResetEmail(url, 'en')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Reset')
  })

  it('should render branded HTML with CTA button in French', async () => {
    const result = await renderResetEmail(url, 'fr')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Réinitialiser')
  })

  it('should include a plain text version in English', async () => {
    const result = await renderResetEmail(url, 'en')
    expect(result.text).toContain(url)
  })

  it('should include a plain text version in French', async () => {
    const result = await renderResetEmail(url, 'fr')
    expect(result.text).toContain(url)
  })

  it('should include a localized subject line', async () => {
    const en = await renderResetEmail(url, 'en')
    const fr = await renderResetEmail(url, 'fr')
    expect(en.subject).toBeTruthy()
    expect(fr.subject).toBeTruthy()
    expect(en.subject).not.toBe(fr.subject)
  })

  it('should fall back to English for unsupported locale', async () => {
    const result = await renderResetEmail(url, 'de')
    expect(result.subject).toBe('Reset your password')
    expect(result.html).toContain('Reset your password')
    expect(result.html).toContain('Reset password')
  })

  it('should match HTML snapshot for English', async () => {
    const result = await renderResetEmail(url, 'en')
    expect(result.html).toMatchSnapshot()
  })

  it('should match HTML snapshot for French', async () => {
    const result = await renderResetEmail(url, 'fr')
    expect(result.html).toMatchSnapshot()
  })

  it('should match plain text snapshot for English', async () => {
    const result = await renderResetEmail(url, 'en')
    expect(result.text).toMatchSnapshot()
  })

  it('should match plain text snapshot for French', async () => {
    const result = await renderResetEmail(url, 'fr')
    expect(result.text).toMatchSnapshot()
  })
})
