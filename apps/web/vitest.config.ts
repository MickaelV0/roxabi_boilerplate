import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { reactConfig } from '../../vitest.shared'

export default defineConfig({
  plugins: [react()],
  resolve: {
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
