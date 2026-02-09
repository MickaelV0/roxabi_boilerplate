import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import type { EmailProvider } from './email.provider.js'

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name)
  private readonly from: string
  private readonly resendClient: Resend | null

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY')
    this.from = config.get<string>('EMAIL_FROM', 'noreply@yourdomain.com')
    this.resendClient = apiKey ? new Resend(apiKey) : null

    if (!apiKey) {
      const nodeEnv = config.get<string>('NODE_ENV', 'development')
      if (nodeEnv === 'production') {
        this.logger.error('RESEND_API_KEY is not set in production — emails will not be sent')
      } else {
        this.logger.warn('RESEND_API_KEY not set — emails will be logged to console')
      }
    }
  }

  async send(params: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    if (!this.resendClient) {
      this.logger.log(`[Console Email] To: ${params.to} | Subject: ${params.subject}`)
      this.logger.log(`[Console Email] HTML: ${params.html}`)
      return
    }

    await this.resendClient.emails.send({
      from: this.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })
  }
}
