import { z } from 'zod'

const Environment = z.enum(['development', 'production', 'test'])

const envSchema = z.object({
  NODE_ENV: Environment.default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.string().default('debug'),
  BETTER_AUTH_SECRET: z.string().default('dev-secret-do-not-use-in-production'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@yourdomain.com'),
  APP_URL: z.string().url().optional(),
})

export type EnvironmentVariables = z.infer<typeof envSchema>

const INSECURE_SECRETS: readonly string[] = [
  'dev-secret-do-not-use-in-production',
  'change-me-to-a-random-32-char-string',
]

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const result = envSchema.safeParse(config)

  if (!result.success) {
    throw new Error(`Environment validation failed:\n${result.error.format()._errors.join('\n')}`)
  }

  const validatedConfig = result.data

  if (
    validatedConfig.NODE_ENV === 'production' &&
    INSECURE_SECRETS.includes(validatedConfig.BETTER_AUTH_SECRET)
  ) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set to a secure value in production. ' +
        'Generate one with: openssl rand -base64 32'
    )
  }

  return validatedConfig
}
