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
  import type { TOCItemType } from 'fumadocs-core/mdx-plugins'

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
            default: React.ComponentType<{ components?: Record<string, unknown> }>
            toc: TOCItemType[]
          },
          props: T
        ) => React.ReactNode
      }): ClientLoader<T>
    }
  }

  const browserCollections: BrowserCollections
  export default browserCollections
}
