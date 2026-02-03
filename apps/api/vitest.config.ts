import { defineConfig } from 'vitest/config'
import { nodeConfig } from '../../vitest.shared'

export default defineConfig({
  test: {
    ...nodeConfig,
    name: 'api',
    root: __dirname,
    setupFiles: ['./src/test/setup.ts'],
  },
})
