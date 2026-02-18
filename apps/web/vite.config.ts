import { fileURLToPath, URL } from 'node:url'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import mdx from 'fumadocs-mdx/vite'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv, type ResolvedConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { z } from 'zod'

const apiTarget = process.env.API_URL || `http://localhost:${process.env.API_PORT || 4000}`

const config = defineConfig(async () => ({
  envDir: '../..',
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: Number(process.env.WEB_PORT) || 3000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    {
      name: 'validate-env',
      configResolved(config: ResolvedConfig) {
        if (config.command === 'build') {
          const envVars = loadEnv(config.mode, config.envDir ?? process.cwd(), 'VITE_')
          // Duplicated from env.shared.ts — Vite config runs outside the app bundle
          // and cannot import app source. Keep in sync manually; check-env-sync.ts
          // will detect drift between this schema and env.shared.ts.
          const schema = z.object({
            VITE_GITHUB_REPO_URL: z.string().url().optional(),
          })
          const result = schema.safeParse(envVars)
          if (!result.success) {
            throw new Error(
              `Client env validation failed:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`
            )
          }
        }
      },
    },
    mdx(await import('./source.config')),
    devtools(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['cookie', 'preferredLanguage', 'url', 'baseLocale'],
    }),
    nitro({
      config: {
        builder: 'rolldown',
        devProxy: {
          '/api/**': { target: apiTarget, changeOrigin: true },
        },
        routeRules: {
          '/api/**': { proxy: `${apiTarget}/api/**` },
        },
      },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
