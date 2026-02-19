import { nodeConfig } from '@repo/vitest-config/node'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    ...nodeConfig,
    name: 'api',
    root: import.meta.dirname,
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
