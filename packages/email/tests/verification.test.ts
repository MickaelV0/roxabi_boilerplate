import { describe, expect, it } from 'vitest'
import { renderVerificationEmail } from '../src/index'

describe('renderVerificationEmail', () => {
  const url = 'https://app.roxabi.com/verify-email?token=abc123'

  it('should render branded HTML with CTA button in English', () => {
    // TODO: implement — Success Criterion: "All three email templates render branded responsive HTML with CTA button, logo, footer"
    const result = renderVerificationEmail(url, 'en')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Verify')
  })

  it('should render branded HTML with CTA button in French', () => {
    // TODO: implement — Success Criterion: "Each email template renders correctly in both EN and FR locales"
    const result = renderVerificationEmail(url, 'fr')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Vérifier')
  })

  it('should include a plain text version in English', () => {
    // TODO: implement — Success Criterion: "Each email template includes a plain text version"
    const result = renderVerificationEmail(url, 'en')
    expect(result.text).toContain(url)
  })

  it('should include a plain text version in French', () => {
    const result = renderVerificationEmail(url, 'fr')
    expect(result.text).toContain(url)
  })

  it('should include a localized subject line', () => {
    const en = renderVerificationEmail(url, 'en')
    const fr = renderVerificationEmail(url, 'fr')
    expect(en.subject).toBeTruthy()
    expect(fr.subject).toBeTruthy()
    expect(en.subject).not.toBe(fr.subject)
  })

  it('should fall back to English for unsupported locale', () => {
    // TODO: implement — Success Criterion: "Email rendered in 'en' when user locale is not in ['en', 'fr']"
    const result = renderVerificationEmail(url, 'de')
    const enResult = renderVerificationEmail(url, 'en')
    expect(result.html).toBe(enResult.html)
  })

  it('should match HTML snapshot for English', () => {
    const result = renderVerificationEmail(url, 'en')
    expect(result.html).toMatchSnapshot()
  })

  it('should match HTML snapshot for French', () => {
    const result = renderVerificationEmail(url, 'fr')
    expect(result.html).toMatchSnapshot()
  })

  it('should match plain text snapshot for English', () => {
    const result = renderVerificationEmail(url, 'en')
    expect(result.text).toMatchSnapshot()
  })

  it('should match plain text snapshot for French', () => {
    const result = renderVerificationEmail(url, 'fr')
    expect(result.text).toMatchSnapshot()
  })
})
