import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

const isProduction = process.env.NODE_ENV === 'production'

// In production, exclude internal-only docs (analyses/, specs/) to reduce SSR bundle.
// These 64 files compile to a ~7 MB chunk that causes OOM during build.
// In development, all docs remain available locally.
// Note: negation globs (!analyses/**) don't work — fumadocs-mdx's normalizeViteGlobPath
// prepends "./" which breaks the "!" prefix. Use positive-only patterns instead.
const publicDocs = {
  files: [
    '*.mdx',
    '*.md',
    'architecture/**',
    'changelog/**',
    'guides/**',
    'processes/**',
    'standards/**',
  ],
}

export const docs = defineDocs({
  dir: 'docs', // Symlink to ../../docs
  ...(isProduction ? { docs: publicDocs, meta: publicDocs } : {}),
})

export default defineConfig()
