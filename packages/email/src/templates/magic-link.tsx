// TODO: implement — Magic link sign-in email template
// Uses @react-email/components for branded responsive HTML
// Rendered via React Email's render() function
// Includes: branded layout, CTA button, expiry notice, i18n via translations

import type { Translations } from '../translations/types'

type MagicLinkEmailProps = {
  url: string
  translations: Translations['magicLink']
}

export function MagicLinkEmail(_props: MagicLinkEmailProps) {
  // TODO: implement — branded magic link email with CTA button
  return null
}
