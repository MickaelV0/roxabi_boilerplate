import { ActionEmail } from '../components/action-email'
import type { Translations } from '../translations/types'

type ResetPasswordEmailProps = {
  url: string
  translations: Translations['reset']
  locale: string
  appUrl?: string
}

export function ResetPasswordEmail(props: ResetPasswordEmailProps) {
  return <ActionEmail {...props} />
}
