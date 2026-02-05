import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

export const docs = defineDocs({
  dir: 'docs', // Symlink to ../../docs
})

export default defineConfig()
