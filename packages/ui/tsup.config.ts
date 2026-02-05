import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/styles.css'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  banner: {
    js: '"use client";',
  },
  loader: {
    '.css': 'copy',
  },
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
    }
  },
})
