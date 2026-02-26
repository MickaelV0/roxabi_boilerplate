import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins'
import { createRehypeCode } from 'fumadocs-core/mdx-plugins/rehype-code.core'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import { shikiConfig } from './src/lib/shiki'

export const docs = defineDocs({
  dir: 'docs', // Symlink to ../../docs
  docs: {
    // Lazy-load MDX body on demand; only frontmatter is eagerly bundled.
    // Prevents OOM during Nitro's Rollup SSR pass with large doc collections.
    async: true,
  },
})

// Use fine-grained Shiki config to avoid bundling all 200+ grammars.
// See src/lib/shiki.ts for details.
const rehypeCode = createRehypeCode(shikiConfig)

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid],
    // Disable default rehype-code (imports full `shiki` bundle → OOM).
    rehypeCodeOptions: false,
    rehypePlugins: [[rehypeCode]],
  },
})
