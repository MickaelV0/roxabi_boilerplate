import { VerificationEmail } from '../src/templates/verification'
import { en } from '../src/translations/en'

export default function Preview() {
  return (
    <VerificationEmail
      url="https://app.roxabi.com/verify?token=abc123"
      translations={en.verification}
      locale="en"
    />
  )
}
