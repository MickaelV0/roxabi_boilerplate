export const EMAIL_SEND_FAILED = 'email.send.failed' as const

export class EmailSendFailedEvent {
  constructor(
    public readonly recipient: string,
    public readonly subject: string,
    public readonly error: Error,
    public readonly timestamp: Date = new Date()
  ) {}
}
