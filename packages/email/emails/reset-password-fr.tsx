import { ResetPasswordEmail } from '../src/templates/reset-password'
import { fr } from '../src/translations/fr'

export default function Preview() {
  return (
    <ResetPasswordEmail
      url="https://app.roxabi.com/reset?token=abc123"
      translations={fr.reset}
      locale="fr"
    />
  )
}
