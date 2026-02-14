import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Globe } from 'lucide-react'
import { m } from '@/paraglide/messages'
import { LocaleSwitcher } from '../components/LocaleSwitcher'

export const Route = createFileRoute('/demo/i18n')({
  component: I18nDemo,
  head: () => ({
    meta: [{ title: `${m.demo_i18n_heading()} | Roxabi` }],
  }),
})

function I18nDemo() {
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
          <h1 className="text-3xl font-bold">{m.demo_i18n_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_i18n_subtitle()}</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>{m.example_message({ username: 'TanStack Router' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <a
              className="text-primary hover:underline"
              href="https://inlang.com/m/gerre34r/library-inlang-paraglideJs"
              target="_blank"
              rel="noopener noreferrer"
            >
              {m.learn_router()}
            </a>
            <div className="flex justify-center">
              <LocaleSwitcher />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
