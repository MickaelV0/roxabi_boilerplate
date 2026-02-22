import { render } from '@react-email/components'
import { createElement } from 'react'
import { MagicLinkEmail } from './templates/magic-link'
import { ResetPasswordEmail } from './templates/reset-password'
import { VerificationEmail } from './templates/verification'
import { getTranslations } from './translations'

export type EmailRenderResult = {
  html: string
  text: string
  subject: string
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function renderVerificationEmail(
  url: string,
  locale: string
): Promise<EmailRenderResult> {
  const translations = getTranslations(locale)

  const element = createElement(VerificationEmail, {
    url,
    translations: translations.verification,
    locale,
  })
  const html = await render(element)
  const text = await render(element, { plainText: true })

  return { html, text, subject: translations.verification.subject }
}

export async function renderResetEmail(url: string, locale: string): Promise<EmailRenderResult> {
  const translations = getTranslations(locale)

  const element = createElement(ResetPasswordEmail, {
    url,
    translations: translations.reset,
    locale,
  })
  const html = await render(element)
  const text = await render(element, { plainText: true })

  return { html, text, subject: translations.reset.subject }
}

export async function renderMagicLinkEmail(
  url: string,
  locale: string
): Promise<EmailRenderResult> {
  const translations = getTranslations(locale)

  const element = createElement(MagicLinkEmail, {
    url,
    translations: translations.magicLink,
    locale,
  })
  const html = await render(element)
  const text = await render(element, { plainText: true })

  return { html, text, subject: translations.magicLink.subject }
}
