import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'

const ssrModes = [
  {
    to: '/demo/start/ssr/spa-mode' as const,
    title: 'SPA Mode',
    desc: 'Client-side rendered with ssr: false',
  },
  {
    to: '/demo/start/ssr/full-ssr' as const,
    title: 'Full SSR',
    desc: 'Server-side rendered with loader data',
  },
  {
    to: '/demo/start/ssr/data-only' as const,
    title: 'Data Only',
    desc: 'Data fetched on server, rendered on client',
  },
]

export const Route = createFileRoute('/demo/start/ssr/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">SSR Demos</h1>
          <p className="mt-2 text-muted-foreground">
            Compare different server-side rendering strategies
          </p>
        </div>

        <div className="grid gap-4">
          {ssrModes.map((mode) => (
            <Link key={mode.to} to={mode.to} className="group">
              <Card className="transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base">{mode.title}</CardTitle>
                  <CardDescription>{mode.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
