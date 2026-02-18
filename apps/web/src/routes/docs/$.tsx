import browserCollections from 'fumadocs-mdx:collections/browser'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page'
import type { ComponentProps } from 'react'
import { createContext, Suspense, useContext } from 'react'
import { DocsErrorBoundary } from '@/components/docs-error-boundary'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'
import { getMDXComponents } from '@/mdx-components'

/** Directory URL for the current page, used to resolve relative MDX links. */
const LinkBaseContext = createContext('')

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? []
    const data = await serverLoader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: 'description', content: loaderData.description ?? '' },
        ]
      : [],
  }),
})

const serverLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()

    // Compute the directory URL for relative link resolution.
    // Use the page URL directly: appending '/' makes relative links
    // resolve within the page's own directory. This is correct for both
    // folder index pages (e.g., /docs/architecture → /docs/architecture/) and
    // leaf pages, matching how MDX authors expect ./foo to resolve.
    const linkBase = `${page.url}/`

    return {
      path: page.path,
      linkBase,
      pageTree: await source.serializePageTree(source.getPageTree()),
      title: page.data.title,
      description: page.data.description,
    }
  })

/** Base MDX components including Mermaid and Fumadocs defaults. */
const mdxComponents = getMDXComponents()

/**
 * Resolve relative MDX links (./foo, ../bar) against the current page URL.
 *
 * TanStack Router's <Link to="./foo"> resolves relative to the *route*,
 * not the URL pathname, which produces wrong paths for splat routes.
 * We resolve them ourselves using standard URL resolution and pass
 * an absolute path to the Link component.
 */
function DocsLink(props: ComponentProps<'a'>) {
  const linkBase = useContext(LinkBaseContext)
  const DefaultLink = mdxComponents.a ?? 'a'

  if (props.href && (props.href.startsWith('./') || props.href.startsWith('../'))) {
    // linkBase is a trailing-slash directory URL (e.g., "/docs/" or "/docs/architecture/").
    // new URL("./vision", "http://n/docs/") resolves to /docs/vision.
    const url = new URL(props.href, `http://n${linkBase}`)
    const resolved = url.pathname + url.hash
    return <DefaultLink {...props} href={resolved} />
  }

  return <DefaultLink {...props} />
}

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    props: {
      className?: string
    }
  ) {
    return (
      <DocsPage toc={toc} {...props}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...mdxComponents,
              a: DocsLink,
            }}
          />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData())

  return (
    <DocsErrorBoundary>
      <DocsLayout {...baseOptions()} tree={data.pageTree}>
        <LinkBaseContext value={data.linkBase}>
          <Suspense>{clientLoader.useContent(data.path)}</Suspense>
        </LinkBaseContext>
      </DocsLayout>
    </DocsErrorBoundary>
  )
}
