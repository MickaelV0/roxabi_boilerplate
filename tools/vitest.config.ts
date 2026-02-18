import { nodeConfig } from '@repo/vitest-config/node'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    ...nodeConfig,
    name: 'tools',
    root: import.meta.dirname,
    include: ['**/*.test.ts'],
  },
})
