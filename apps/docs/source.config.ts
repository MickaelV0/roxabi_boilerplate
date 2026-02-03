import path from 'path'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

// Resolve docs path to support both local dev and Docker builds
// without needing a symlink
const docsDir = process.env.DOCS_ROOT || path.resolve(__dirname, '../../docs')

export const docs = defineDocs({
  dir: docsDir,
})

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
})
