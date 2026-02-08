import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { EmailProvider } from './email.provider.js'

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name)
  private readonly apiKey: string | undefined
  private readonly from: string

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY')
    this.from = config.get<string>('EMAIL_FROM', 'noreply@yourdomain.com')

    if (!this.apiKey) {
      const nodeEnv = config.get<string>('NODE_ENV', 'development')
      if (nodeEnv === 'production') {
        this.logger.error('RESEND_API_KEY is not set in production — emails will not be sent')
      } else {
        this.logger.warn('RESEND_API_KEY not set — emails will be logged to console')
      }
    }
  }

  async send(params: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    if (!this.apiKey) {
      this.logger.log(`[Console Email] To: ${params.to} | Subject: ${params.subject}`)
      this.logger.log(`[Console Email] HTML: ${params.html}`)
      return
    }

    const { Resend } = await import('resend')
    const resend = new Resend(this.apiKey)

    await resend.emails.send({
      from: this.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })
  }
}
