import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'

import { m } from '@/paraglide/messages'

function getDemos() {
  return [
    {
      category: m.demo_category_tanstack(),
      items: [
        { to: '/demo/store', title: m.demo_store_title(), desc: m.demo_store_desc() },
        { to: '/demo/tanstack-query', title: m.demo_query_title(), desc: m.demo_query_desc() },
        {
          to: '/demo/table',
          title: m.demo_table_title(),
          desc: m.demo_table_desc(),
        },
      ],
    },
    {
      category: m.demo_category_forms(),
      items: [
        {
          to: '/demo/form/simple',
          title: m.demo_form_simple_title(),
          desc: m.demo_form_simple_desc(),
        },
        {
          to: '/demo/form/address',
          title: m.demo_form_address_title(),
          desc: m.demo_form_address_desc(),
        },
        {
          to: '/demo/form/steps',
          title: m.demo_form_steps_title(),
          desc: m.demo_form_steps_desc(),
        },
      ],
    },
    {
      category: m.demo_category_ssr(),
      items: [
        { to: '/demo/start/ssr', title: m.demo_ssr_modes_title(), desc: m.demo_ssr_modes_desc() },
        {
          to: '/demo/start/server-funcs',
          title: m.demo_server_funcs_title(),
          desc: m.demo_server_funcs_desc(),
        },
        { to: '/demo/start/api-request', title: m.demo_api_title(), desc: m.demo_api_desc() },
      ],
    },
    {
      category: m.demo_category_i18n(),
      items: [{ to: '/demo/i18n', title: m.demo_i18n_title(), desc: m.demo_i18n_desc() }],
    },
  ]
}

export const Route = createFileRoute('/demo/')({
  component: DemoIndex,
  head: () => ({
    meta: [{ title: `${m.demo_title()} | Roxabi` }],
  }),
})

function DemoIndex() {
  const demos = getDemos()

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{m.demo_title()}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{m.demo_subtitle()}</p>
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
