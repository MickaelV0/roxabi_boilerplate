import { defineDocs, defineConfig } from 'fumadocs-mdx/config'
import path from 'path'

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
