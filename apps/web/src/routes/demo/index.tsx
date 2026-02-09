import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'

const demos = [
  {
    category: 'TanStack',
    items: [
      { to: '/demo/store', title: 'Store', desc: 'TanStack Store with reactive state management' },
      { to: '/demo/tanstack-query', title: 'Query', desc: 'TanStack Query with CRUD operations' },
      {
        to: '/demo/table',
        title: 'Table',
        desc: 'TanStack Table with sorting, filtering, pagination',
      },
    ],
  },
  {
    category: 'Forms',
    items: [
      { to: '/demo/form/simple', title: 'Simple Form', desc: 'Basic form with TanStack Form' },
      { to: '/demo/form/address', title: 'Address Form', desc: 'Nested fields and validation' },
      { to: '/demo/form/steps', title: 'Multi-Step', desc: 'Wizard-style multi-step form' },
    ],
  },
  {
    category: 'SSR & Server',
    items: [
      { to: '/demo/start/ssr', title: 'SSR Modes', desc: 'SPA, Full SSR, and Data-Only modes' },
      {
        to: '/demo/start/server-funcs',
        title: 'Server Functions',
        desc: 'TanStack Start server functions',
      },
      { to: '/demo/start/api-request', title: 'API Request', desc: 'Fetch from API routes' },
    ],
  },
  {
    category: 'i18n',
    items: [
      { to: '/demo/i18n', title: 'Internationalization', desc: 'Paraglide JS locale switching' },
    ],
  },
] as const

export const Route = createFileRoute('/demo/')({
  component: DemoIndex,
})

function DemoIndex() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Demos</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Interactive examples showcasing the boilerplate&apos;s tech stack.
        </p>
      </div>

      <div className="grid gap-10">
        {demos.map((group) => (
          <section key={group.category}>
            <h2 className="mb-4 text-xl font-semibold">{group.category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((demo) => (
                <Link key={demo.to} to={demo.to} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-base">{demo.title}</CardTitle>
                      <CardDescription>{demo.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
