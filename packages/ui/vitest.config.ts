import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { reactConfig } from '../../vitest.shared'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    ...reactConfig,
    name: 'ui',
    root: dirname,
    setupFiles: [`${dirname}/src/test/setup.ts`],
  },
})
