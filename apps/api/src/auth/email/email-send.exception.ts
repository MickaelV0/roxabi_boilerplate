import { InternalServerErrorException } from '@nestjs/common'

export class EmailSendException extends InternalServerErrorException {
  constructor(recipient: string, cause?: Error) {
    super(`Failed to send email to ${recipient}`)
    this.cause = cause
  }
}
