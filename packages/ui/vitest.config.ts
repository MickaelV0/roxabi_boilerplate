import { fileURLToPath } from 'node:url'
import { reactConfig } from '@repo/vitest-config/react'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * Vitest config for @repo/ui package.
 *
 * IMPORTANT: @/lib/utils must resolve to ./src/lib/utils (this package),
 * not to apps/web/src. The resolve.alias ensures package-local resolution.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure @ resolves to packages/ui/src, not the consuming app
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Explicit alias to avoid confusion with @repo/ui references
      '@repo/ui': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    ...reactConfig,
    name: 'ui',
    root: dirname,
    setupFiles: [`${dirname}/src/test/setup.ts`],
    // Ensure imports from this package use its own aliases
    globals: true,
  },
})
