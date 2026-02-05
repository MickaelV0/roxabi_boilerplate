// Type declarations for fumadocs-mdx virtual modules
declare module 'fumadocs-mdx:collections/server' {
  import type { Docs } from 'fumadocs-mdx/config'

  export const docs: Docs & {
    toFumadocsSource(): import('fumadocs-core/source').Source<{
      title: string
      description?: string
    }>
  }
}

declare module 'fumadocs-mdx:collections/browser' {
  interface ClientLoader<T> {
    preload(path: string): Promise<void>
    useContent(path: string, props?: T): React.ReactNode
  }

  interface BrowserCollections {
    docs: {
      raw: unknown[]
      createClientLoader<T = Record<string, never>>(options: {
        component: (
          compiled: {
            frontmatter: { title: string; description?: string }
            default: React.ComponentType
          },
          props: T
        ) => React.ReactNode
      }): ClientLoader<T>
    }
  }

  const browserCollections: BrowserCollections
  export default browserCollections
}
