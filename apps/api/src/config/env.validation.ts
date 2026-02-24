import { z } from 'zod'

/** Coerce env-var strings ('true'/'false') to booleans. Unlike z.coerce.boolean(), handles 'false' correctly. */
const booleanFromEnv = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true'
  return val
}, z.boolean())

const Environment = z.enum(['development', 'production', 'test'])

export const envSchema = z.object({
  NODE_ENV: Environment.default('development'),
  PORT: z.coerce.number().default(4000),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  DATABASE_URL: z.string().optional(),
  DATABASE_APP_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.string().default('debug'),
  BETTER_AUTH_SECRET: z.string().min(32).default('dev-secret-do-not-use-in-production'),
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
  RATE_LIMIT_ENABLED: booleanFromEnv.default(true),
  SWAGGER_ENABLED: booleanFromEnv.optional(),
  RATE_LIMIT_GLOBAL_TTL: z.coerce.number().positive().default(60_000),
  RATE_LIMIT_GLOBAL_LIMIT: z.coerce.number().positive().default(60),
  RATE_LIMIT_AUTH_TTL: z.coerce.number().positive().default(60_000),
  RATE_LIMIT_AUTH_LIMIT: z.coerce.number().positive().default(5),
  RATE_LIMIT_AUTH_BLOCK_DURATION: z.coerce.number().positive().default(300_000),
  // CRON secret for scheduled jobs (purge, etc.)
  CRON_SECRET: z.string().optional(),
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
  validateAuthSecret(validatedConfig)
  validateSecurityWarnings(validatedConfig)
  validateRateLimitRedis(validatedConfig)

  return validatedConfig
}

function validateAuthSecret(config: EnvironmentVariables) {
  // Guard uses !== 'development' (not === 'production') to cover preview, staging, and test
  // environments -- any non-local context must use a real secret.
  if (config.NODE_ENV !== 'development' && INSECURE_SECRETS.includes(config.BETTER_AUTH_SECRET)) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set to a secure value in non-development environments. ' +
        'Generate one with: openssl rand -base64 32'
    )
  }

  // Secondary guard: catches Vercel preview deployments where NODE_ENV may still be
  // 'development' but the app is running in a cloud environment that requires a real secret.
  if (config.VERCEL_ENV && INSECURE_SECRETS.includes(config.BETTER_AUTH_SECRET)) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set to a secure value on Vercel deployments. ' +
        'Generate one with: openssl rand -base64 32'
    )
  }
}

function validateSecurityWarnings(config: EnvironmentVariables) {
  if (config.NODE_ENV === 'production' && config.RATE_LIMIT_ENABLED === false) {
    console.error(
      '[SECURITY] RATE_LIMIT_ENABLED=false in production — auth brute-force protection is DISABLED. ' +
        'Set RATE_LIMIT_ENABLED=true and configure KV_REST_API_URL/TOKEN.'
    )
  }

  // Warn when CRON_SECRET is unset in non-development environments.
  // The purge endpoint degrades gracefully (rejects unauthenticated requests),
  // so this is a warning, not a hard failure.
  if (config.NODE_ENV !== 'development' && !config.CRON_SECRET) {
    console.warn(
      '[SECURITY] CRON_SECRET is not set in a non-development environment. ' +
        'Scheduled job endpoints (e.g., purge) will reject all requests. ' +
        'Set CRON_SECRET to a secure value: openssl rand -base64 32'
    )
  }
}

function validateRateLimitRedis(config: EnvironmentVariables) {
  if (
    config.NODE_ENV === 'production' &&
    config.RATE_LIMIT_ENABLED === true &&
    !(config.KV_REST_API_URL && config.KV_REST_API_TOKEN)
  ) {
    throw new Error(
      'KV_REST_API_URL and KV_REST_API_TOKEN are required in production when rate limiting is enabled. ' +
        'Provision Upstash Redis via Vercel Marketplace, set them manually, or set RATE_LIMIT_ENABLED=false for previews.'
    )
  }
}
