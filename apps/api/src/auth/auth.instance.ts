import { renderMagicLinkEmail, renderResetEmail, renderVerificationEmail } from '@repo/email'
import { DICEBEAR_CDN_BASE } from '@repo/types'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins/admin'
import { magicLink } from 'better-auth/plugins/magic-link'
import { organization } from 'better-auth/plugins/organization'
import { eq } from 'drizzle-orm'
import type { DrizzleDB } from '../database/drizzle.provider.js'
import { users } from '../database/schema/auth.schema.js'
import type { EmailProvider } from './email/email.provider.js'

type UserWithLocale = { locale?: string }

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type AuthInstanceConfig = {
  secret: string
  baseURL: string
  appURL?: string
  googleClientId?: string
  googleClientSecret?: string
  githubClientId?: string
  githubClientSecret?: string
}

export type OrganizationCreatedCallback = (data: {
  organizationId: string
  creatorUserId: string
}) => void | Promise<void>

export function createBetterAuth(
  db: DrizzleDB,
  emailProvider: EmailProvider,
  config: AuthInstanceConfig,
  onOrganizationCreated?: OrganizationCreatedCallback
) {
  const socialProviders: Record<string, unknown> = {}

  if (config.googleClientId && config.googleClientSecret) {
    socialProviders.google = {
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    }
  }

  if (config.githubClientId && config.githubClientSecret) {
    socialProviders.github = {
      clientId: config.githubClientId,
      clientSecret: config.githubClientSecret,
    }
  }

  const trustedOrigins = config.appURL ? [config.appURL] : []

  return betterAuth({
    basePath: '/api/auth',
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins,
    user: {
      additionalFields: {
        locale: {
          type: 'string',
          required: false,
          defaultValue: 'en',
          input: true,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              const updateFields: Record<string, unknown> = {
                avatarStyle: 'lorelei',
                avatarSeed: user.id,
                avatarOptions: {},
              }
              if (!user.image) {
                updateFields.image = `${DICEBEAR_CDN_BASE}/lorelei/svg?seed=${user.id}`
              }
              await db.update(users).set(updateFields).where(eq(users.id, user.id))
            } catch (error) {
              console.warn('Failed to set default avatar for user', user.id, error)
            }
          },
        },
      },
    },
    database: drizzleAdapter(db, {
      provider: 'pg',
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      async sendResetPassword({ user, url }) {
        try {
          const locale = (user as UserWithLocale).locale ?? 'en'
          const { html, text, subject } = await renderResetEmail(url, locale)
          await emailProvider.send({
            to: user.email,
            subject,
            html,
            text,
          })
        } catch (error) {
          console.error('Failed to render reset password email, using fallback:', error)
          await emailProvider.send({
            to: user.email,
            subject: 'Reset your password',
            html: `<p>Click <a href="${escapeHtml(url)}">here</a> to reset your password.</p>`,
          })
        }
      },
    },
    emailVerification: {
      sendOnSignIn: true,
      async sendVerificationEmail({ user, url }) {
        try {
          const locale = (user as UserWithLocale).locale ?? 'en'
          const { html, text, subject } = await renderVerificationEmail(url, locale)
          await emailProvider.send({
            to: user.email,
            subject,
            html,
            text,
          })
        } catch (error) {
          console.error('Failed to render verification email, using fallback:', error)
          await emailProvider.send({
            to: user.email,
            subject: 'Verify your email',
            html: `<p>Click <a href="${escapeHtml(url)}">here</a> to verify your email.</p>`,
          })
        }
      },
    },
    socialProviders,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    plugins: [
      organization({
        schema: {
          organization: {
            additionalFields: {
              deletedAt: {
                type: 'date',
                required: false,
                input: false,
              },
              deleteScheduledFor: {
                type: 'date',
                required: false,
                input: false,
              },
            },
          },
        },
        organizationHooks: onOrganizationCreated
          ? {
              afterCreateOrganization: async ({ organization: org, member }) => {
                onOrganizationCreated({
                  organizationId: org.id,
                  creatorUserId: member.userId,
                })
              },
            }
          : undefined,
      }),
      admin(),
      magicLink({
        async sendMagicLink({ email, url }) {
          try {
            const [userData] = await db
              .select({ locale: users.locale })
              .from(users)
              .where(eq(users.email, email))
            const locale = userData?.locale ?? 'en'
            const { html, text, subject } = await renderMagicLinkEmail(url, locale)
            await emailProvider.send({
              to: email,
              subject,
              html,
              text,
            })
          } catch (error) {
            console.error('Failed to render magic link email, using fallback:', error)
            await emailProvider.send({
              to: email,
              subject: 'Sign in to Roxabi',
              html: `<p>Click <a href="${escapeHtml(url)}">here</a> to sign in.</p>`,
            })
          }
        },
      }),
    ],
  })
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>
