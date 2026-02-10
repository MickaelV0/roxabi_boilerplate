export class EmailSendException extends Error {
  constructor(
    public readonly recipient: string,
    cause?: Error
  ) {
    super(`Failed to send email to ${recipient}`)
    this.cause = cause
  }
}
