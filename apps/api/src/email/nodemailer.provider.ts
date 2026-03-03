import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer from 'nodemailer'
import { toError } from '../common/utils/toError.js'
import type { EmailProvider } from './email.provider.js'
import { EmailSendException } from './emailSend.exception.js'

@Injectable()
export class NodemailerEmailProvider implements EmailProvider {
  private readonly logger = new Logger(NodemailerEmailProvider.name)
  private readonly transporter: nodemailer.Transporter

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST', 'localhost')
    const port = config.get<number>('SMTP_PORT', 1025)
    this.transporter = nodemailer.createTransport({ host, port, secure: false })
  }

  async send(params: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    try {
      await this.transporter.sendMail({ from: 'dev@localhost', ...params })
    } catch (error) {
      const cause = toError(error)
      this.logger.error(`Failed to send email to ${params.to}: ${cause.message}`, cause.stack)
      throw new EmailSendException(params.to, cause)
    }
  }
}
