import { z } from 'zod'

export const envSchema = z.object({
  API_URL: z.string().url().default('http://localhost:4000'),
  APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
})

export type ServerEnv = z.infer<typeof envSchema>

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(
    `Server env validation failed:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`
  )
}

if (parsed.data.NODE_ENV !== 'development' && !process.env.API_URL) {
  throw new Error('API_URL must be explicitly set in non-development environments')
}

export const env: ServerEnv = parsed.data
