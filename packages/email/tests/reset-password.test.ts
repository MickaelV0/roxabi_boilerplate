import { describe, expect, it } from 'vitest'
import { renderResetEmail } from '../src/index'

describe('renderResetEmail', () => {
  const url = 'https://app.roxabi.com/reset-password/confirm?token=abc123'

  it('should render branded HTML with CTA button in English', () => {
    // TODO: implement — Success Criterion: "All three email templates render branded responsive HTML with CTA button, logo, footer"
    const result = renderResetEmail(url, 'en')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Reset')
  })

  it('should render branded HTML with CTA button in French', () => {
    const result = renderResetEmail(url, 'fr')
    expect(result.html).toContain(url)
    expect(result.html).toContain('Réinitialiser')
  })

  it('should include a plain text version in English', () => {
    const result = renderResetEmail(url, 'en')
    expect(result.text).toContain(url)
  })

  it('should include a plain text version in French', () => {
    const result = renderResetEmail(url, 'fr')
    expect(result.text).toContain(url)
  })

  it('should include a localized subject line', () => {
    const en = renderResetEmail(url, 'en')
    const fr = renderResetEmail(url, 'fr')
    expect(en.subject).toBeTruthy()
    expect(fr.subject).toBeTruthy()
    expect(en.subject).not.toBe(fr.subject)
  })

  it('should fall back to English for unsupported locale', () => {
    const result = renderResetEmail(url, 'de')
    const enResult = renderResetEmail(url, 'en')
    expect(result.html).toBe(enResult.html)
  })

  it('should match HTML snapshot for English', () => {
    const result = renderResetEmail(url, 'en')
    expect(result.html).toMatchSnapshot()
  })

  it('should match HTML snapshot for French', () => {
    const result = renderResetEmail(url, 'fr')
    expect(result.html).toMatchSnapshot()
  })

  it('should match plain text snapshot for English', () => {
    const result = renderResetEmail(url, 'en')
    expect(result.text).toMatchSnapshot()
  })

  it('should match plain text snapshot for French', () => {
    const result = renderResetEmail(url, 'fr')
    expect(result.text).toMatchSnapshot()
  })
})
