import { nodeConfig } from '@repo/vitest-config/node'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    ...nodeConfig,
    name: 'skills',
    root: import.meta.dirname,
    include: ['**/__tests__/**/*.test.ts'],
  },
})
