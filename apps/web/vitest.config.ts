import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { reactConfig } from '../../vitest.shared'

export default defineConfig({
  plugins: [react()],
  test: {
    ...reactConfig,
    name: 'web',
    root: __dirname,
    setupFiles: ['./src/test/setup.ts'],
  },
})
