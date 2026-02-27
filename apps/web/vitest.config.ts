import { fileURLToPath } from 'node:url'
import { reactConfig } from '@repo/vitest-config/react'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ['source'],
    alias: [
      // @repo/ui source components use their own @/ alias (packages/ui/src).
      // Map specific internal paths before the broad `@` alias intercepts them.
      {
        find: '@/lib/utils',
        replacement: fileURLToPath(new URL('../../packages/ui/src/lib/utils', import.meta.url)),
      },
      {
        find: '@/lib/useReducedMotion',
        replacement: fileURLToPath(
          new URL('../../packages/ui/src/lib/useReducedMotion', import.meta.url)
        ),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  test: {
    ...reactConfig,
    name: 'web',
    root: import.meta.dirname,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: false,
  },
})
