import { describe, expect, it } from 'vitest'
import { renderVerificationEmail } from '../src/index'

describe('renderVerificationEmail', () => {
  const url = 'https://app.roxabi.com/verify-email?token=abc123'

  it('should render branded HTML with CTA button in English', async () => {
    const result = await renderVerificationEmail(url, 'en')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Verify')
  })

  it('should render branded HTML with CTA button in French', async () => {
    const result = await renderVerificationEmail(url, 'fr')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Vérifier')
  })

  it('should include a plain text version in English', async () => {
    const result = await renderVerificationEmail(url, 'en')
    expect(result.text).toContain(url)
  })

  it('should include a plain text version in French', async () => {
    const result = await renderVerificationEmail(url, 'fr')
    expect(result.text).toContain(url)
  })

  it('should include a localized subject line', async () => {
    const en = await renderVerificationEmail(url, 'en')
    const fr = await renderVerificationEmail(url, 'fr')
    expect(en.subject).toBeTruthy()
    expect(fr.subject).toBeTruthy()
    expect(en.subject).not.toBe(fr.subject)
  })

  it('should fall back to English for unsupported locale', async () => {
    const result = await renderVerificationEmail(url, 'de')
    expect(result.subject).toBe('Verify your email')
    expect(result.html).toContain('Verify your email address')
    expect(result.html).toContain('Verify email')
  })

  it('should match HTML snapshot for English', async () => {
    const result = await renderVerificationEmail(url, 'en')
    expect(result.html).toMatchSnapshot()
  })

  it('should match HTML snapshot for French', async () => {
    const result = await renderVerificationEmail(url, 'fr')
    expect(result.html).toMatchSnapshot()
  })

  it('should match plain text snapshot for English', async () => {
    const result = await renderVerificationEmail(url, 'en')
    expect(result.text).toMatchSnapshot()
  })

  it('should match plain text snapshot for French', async () => {
    const result = await renderVerificationEmail(url, 'fr')
    expect(result.text).toMatchSnapshot()
  })
})
