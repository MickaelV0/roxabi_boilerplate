import { ResetPasswordEmail } from '../src/templates/resetPassword'
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
