import { z } from 'zod'

const Environment = z.enum(['development', 'production', 'test'])

const envSchema = z.object({
  NODE_ENV: Environment.default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.string().default('debug'),
  BETTER_AUTH_SECRET: z.string().default('dev-secret-do-not-use-in-production'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:4000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@yourdomain.com'),
  APP_URL: z.string().url().optional(),
  // Rate limiting & Upstash Redis
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  SWAGGER_ENABLED: z.enum(['true', 'false']).optional(),
  RATE_LIMIT_GLOBAL_TTL: z.coerce.number().positive().default(60_000),
  RATE_LIMIT_GLOBAL_LIMIT: z.coerce.number().positive().default(60),
  RATE_LIMIT_AUTH_TTL: z.coerce.number().positive().default(60_000),
  RATE_LIMIT_AUTH_LIMIT: z.coerce.number().positive().default(5),
  RATE_LIMIT_AUTH_BLOCK_DURATION: z.coerce.number().positive().default(300_000),
  // Reserved for the future API key rate-limit tier
  RATE_LIMIT_API_TTL: z.coerce.number().default(60_000),
  RATE_LIMIT_API_LIMIT: z.coerce.number().default(100),
})

export type EnvironmentVariables = z.infer<typeof envSchema>

const INSECURE_SECRETS: readonly string[] = [
  'dev-secret-do-not-use-in-production',
  'change-me-to-a-random-32-char-string',
]

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const result = envSchema.safeParse(config)

  if (!result.success) {
    throw new Error(
      `Environment validation failed:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`
    )
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

  if (validatedConfig.NODE_ENV === 'production' && validatedConfig.RATE_LIMIT_ENABLED === false) {
    console.error(
      '[SECURITY] RATE_LIMIT_ENABLED=false in production — auth brute-force protection is DISABLED. ' +
        'Set RATE_LIMIT_ENABLED=true and configure KV_REST_API_URL/TOKEN.'
    )
  }

  if (
    validatedConfig.NODE_ENV === 'production' &&
    validatedConfig.RATE_LIMIT_ENABLED === true &&
    (!validatedConfig.KV_REST_API_URL || !validatedConfig.KV_REST_API_TOKEN)
  ) {
    throw new Error(
      'KV_REST_API_URL and KV_REST_API_TOKEN are required in production when rate limiting is enabled. ' +
        'Provision Upstash Redis via Vercel Marketplace, set them manually, or set RATE_LIMIT_ENABLED=false for previews.'
    )
  }

  return validatedConfig
}
