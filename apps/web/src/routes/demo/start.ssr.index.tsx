import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/demo/start/ssr/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: `${m.demo_ssr_heading()} | Roxabi` }],
  }),
})

function RouteComponent() {
  const ssrModes = [
    {
      to: '/demo/start/ssr/spa-mode' as const,
      title: m.demo_ssr_spa_title(),
      desc: m.demo_ssr_spa_desc(),
    },
    {
      to: '/demo/start/ssr/full-ssr' as const,
      title: m.demo_ssr_full_title(),
      desc: m.demo_ssr_full_desc(),
    },
    {
      to: '/demo/start/ssr/data-only' as const,
      title: m.demo_ssr_data_title(),
      desc: m.demo_ssr_data_desc(),
    },
  ]

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link
          to="/demo"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          {m.demo_back_to_demos()}
        </Link>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{m.demo_ssr_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_ssr_subtitle()}</p>
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
