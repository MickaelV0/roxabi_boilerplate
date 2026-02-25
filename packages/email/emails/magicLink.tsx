import { MagicLinkEmail } from '../src/templates/magicLink'
import { en } from '../src/translations/en'

export default function Preview() {
  return (
    <MagicLinkEmail
      url="https://app.roxabi.com/magic?token=abc123"
      translations={en.magicLink}
      locale="en"
    />
  )
}
