import { ActionEmail } from '../components/action-email'
import type { Translations } from '../translations/types'

type VerificationEmailProps = {
  url: string
  translations: Translations['verification']
  locale: string
  appUrl?: string
}

export function VerificationEmail(props: VerificationEmailProps) {
  return <ActionEmail {...props} />
}
