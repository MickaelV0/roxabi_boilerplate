import { envSchema, type ServerEnv } from './env.server.schema.js'

export { envSchema, type ServerEnv } from './env.server.schema.js'

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(
    `Server env validation failed:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`
  )
}

// Require explicit API_URL in non-development environments
if (parsed.data.NODE_ENV !== 'development' && !process.env.API_URL) {
  throw new Error('API_URL must be explicitly set in non-development environments')
}

export const env: ServerEnv = parsed.data
