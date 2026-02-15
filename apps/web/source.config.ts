import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

export const docs = defineDocs({
  dir: 'docs', // Symlink to ../../docs
  docs: {
    // Lazy-load MDX body on demand; only frontmatter is eagerly bundled.
    // Prevents OOM during Nitro's Rollup SSR pass with large doc collections.
    async: true,
  },
})

export default defineConfig()
