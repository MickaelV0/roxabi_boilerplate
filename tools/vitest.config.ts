import { defineConfig } from 'vitest/config'
import { nodeConfig } from '../packages/config/src/vitest'

export default defineConfig({
  test: {
    ...nodeConfig,
    name: 'tools',
    root: import.meta.dirname,
    include: ['**/*.test.ts'],
  },
})
