import { z } from 'zod'

export const clientEnvSchema = z.object({
  VITE_ENABLE_DEMO: z.string().optional().default('true'),
  VITE_GITHUB_REPO_URL: z.string().url().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

export const clientEnv: ClientEnv = clientEnvSchema.parse({
  VITE_ENABLE_DEMO: import.meta.env.VITE_ENABLE_DEMO,
  VITE_GITHUB_REPO_URL: import.meta.env.VITE_GITHUB_REPO_URL,
})
