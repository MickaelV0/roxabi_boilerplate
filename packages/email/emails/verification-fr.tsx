import { VerificationEmail } from '../src/templates/verification'
import { fr } from '../src/translations/fr'

export default function Preview() {
  return (
    <VerificationEmail
      url="https://app.roxabi.com/verify?token=abc123"
      translations={fr.verification}
      locale="fr"
    />
  )
}
