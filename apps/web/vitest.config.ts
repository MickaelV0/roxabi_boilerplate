import { fileURLToPath } from 'node:url'
import { reactConfig } from '@repo/config/vitest'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ['source'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    ...reactConfig,
    name: 'web',
    root: import.meta.dirname,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
  },
})
