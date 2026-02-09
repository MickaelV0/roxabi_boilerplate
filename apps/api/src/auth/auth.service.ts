import { Inject, Injectable } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { FastifyRequest } from 'fastify'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { type BetterAuthInstance, createBetterAuth } from './auth.instance.js'
import { EMAIL_PROVIDER, type EmailProvider } from './email/email.provider.js'
import { toFetchHeaders } from './fastify-headers.js'

@Injectable()
export class AuthService {
  private readonly auth: BetterAuthInstance

  constructor(
    @Inject(DRIZZLE) db: DrizzleDB,
    @Inject(EMAIL_PROVIDER) emailProvider: EmailProvider,
    config: ConfigService
  ) {
    this.auth = createBetterAuth(db, emailProvider, {
      secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
      baseURL: config.get<string>('BETTER_AUTH_URL', 'http://localhost:3001'),
      googleClientId: config.get<string>('GOOGLE_CLIENT_ID'),
      googleClientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
      githubClientId: config.get<string>('GITHUB_CLIENT_ID'),
      githubClientSecret: config.get<string>('GITHUB_CLIENT_SECRET'),
    })
  }

  async handler(request: Request): Promise<Response> {
    return this.auth.handler(request)
  }

  async getSession(request: FastifyRequest) {
    const headers = toFetchHeaders(request)
    const session = await this.auth.api.getSession({ headers })
    return session
  }
}
