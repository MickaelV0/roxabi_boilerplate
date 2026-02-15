import { z } from 'zod'

export const envSchema = z.object({
  API_URL: z.string().url().default('http://localhost:4000'),
  APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VITE_ENABLE_DEMO: z.string().optional().default('true'),
})

export type ServerEnv = z.infer<typeof envSchema>
