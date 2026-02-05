import browserCollections from 'fumadocs-mdx:collections/browser'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { Root } from 'fumadocs-core/page-tree'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import { source } from '@/lib/source'

const serverLoader = createServerFn({ method: 'GET' })
  .inputValidator((input: string[]) => input)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()

    return {
      path: page.path,
      tree: source.pageTree as object,
      title: page.data.title,
      description: page.data.description,
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component({ frontmatter, default: MDX }) {
    return (
      <>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        {frontmatter.description && <DocsDescription>{frontmatter.description}</DocsDescription>}
        <DocsBody>
          <MDX />
        </DocsBody>
      </>
    )
  },
})

export const Route = createFileRoute('/docs/$')({
  component: DocsPageComponent,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? []
    const data = await serverLoader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
  head: ({ loaderData }) => {
    return {
      meta: loaderData
        ? [{ title: loaderData.title }, { name: 'description', content: loaderData.description }]
        : [],
    }
  },
})

function DocsPageComponent() {
  const data = Route.useLoaderData()

  return (
    <DocsLayout tree={data.tree as Root}>
      <DocsPage>{clientLoader.useContent(data.path)}</DocsPage>
    </DocsLayout>
  )
}
