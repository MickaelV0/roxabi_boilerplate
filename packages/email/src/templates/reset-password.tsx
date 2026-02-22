// TODO: implement — Password reset email template
// Uses @react-email/components for branded responsive HTML
// Rendered via React Email's render() function
// Includes: branded layout, CTA button, expiry notice, i18n via translations

import type { Translations } from '../translations/types'

type ResetPasswordEmailProps = {
  url: string
  translations: Translations['reset']
}

export function ResetPasswordEmail(_props: ResetPasswordEmailProps) {
  // TODO: implement — branded reset password email with CTA button
  return null
}
