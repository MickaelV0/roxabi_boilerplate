import { MagicLinkEmail } from '../src/templates/magic-link'
import { fr } from '../src/translations/fr'

export default function Preview() {
  return (
    <MagicLinkEmail
      url="https://app.roxabi.com/magic?token=abc123"
      translations={fr.magicLink}
      locale="fr"
    />
  )
}
