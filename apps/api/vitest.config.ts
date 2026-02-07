import { nodeConfig } from '@repo/config/vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    ...nodeConfig,
    name: 'api',
    root: __dirname,
    setupFiles: ['./src/test/setup.ts'],
  },
})
