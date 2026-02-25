import { ResetPasswordEmail } from '../src/templates/resetPassword'
import { en } from '../src/translations/en'

export default function Preview() {
  return (
    <ResetPasswordEmail
      url="https://app.roxabi.com/reset?token=abc123"
      translations={en.reset}
      locale="en"
    />
  )
}
