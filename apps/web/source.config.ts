import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

export const docs = defineDocs({
  dir: 'docs', // Uses symlink to repo root docs folder
})

export default defineConfig()
