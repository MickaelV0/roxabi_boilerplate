import { ActionEmail } from '../components/action-email'
import type { Translations } from '../translations/types'

type MagicLinkEmailProps = {
  url: string
  translations: Translations['magicLink']
  locale: string
  appUrl?: string
}

export function MagicLinkEmail(props: MagicLinkEmailProps) {
  return <ActionEmail {...props} />
}
