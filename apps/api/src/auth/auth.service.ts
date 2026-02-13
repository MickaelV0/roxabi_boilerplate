import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { FastifyRequest } from 'fastify'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { type BetterAuthInstance, createBetterAuth } from './auth.instance.js'
import { EMAIL_PROVIDER, type EmailProvider } from './email/email.provider.js'
import { toFetchHeaders } from './fastify-headers.js'

@Injectable()
export class AuthService {
  private readonly auth: BetterAuthInstance
  readonly enabledProviders: { google: boolean; github: boolean }

  constructor(
    @Inject(DRIZZLE) db: DrizzleDB,
    @Inject(EMAIL_PROVIDER) emailProvider: EmailProvider,
    config: ConfigService
  ) {
    const googleClientId = config.get<string>('GOOGLE_CLIENT_ID')
    const googleClientSecret = config.get<string>('GOOGLE_CLIENT_SECRET')
    const githubClientId = config.get<string>('GITHUB_CLIENT_ID')
    const githubClientSecret = config.get<string>('GITHUB_CLIENT_SECRET')

    this.enabledProviders = {
      google: !!(googleClientId && googleClientSecret),
      github: !!(githubClientId && githubClientSecret),
    }

    this.auth = createBetterAuth(db, emailProvider, {
      secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
      baseURL: config.get<string>('BETTER_AUTH_URL', 'http://localhost:3001'),
      appURL: config.get<string>('APP_URL', 'http://localhost:3000'),
      googleClientId,
      googleClientSecret,
      githubClientId,
      githubClientSecret,
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
