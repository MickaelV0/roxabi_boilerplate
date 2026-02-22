import { fileURLToPath } from 'node:url'
import { nodeConfig } from '@repo/vitest-config/node'
import { defineConfig } from 'vitest/config'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    ...nodeConfig,
    name: 'email',
    root: dirname,
    include: ['tests/**/*.test.ts'],
  },
})
