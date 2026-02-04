import { createFileRoute, Link } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col flex-1 justify-center px-4 py-8 text-center">
        <h1 className="font-medium text-2xl mb-4">{m.common_app_name()}</h1>
        <p className="text-fd-muted-foreground mb-8">{m.common_app_description()}</p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/docs/$"
            params={{ _splat: '' }}
            className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm"
          >
            {m.common_nav_docs()}
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg bg-fd-muted text-fd-muted-foreground font-medium text-sm hover:bg-fd-accent"
          >
            {m.common_nav_dashboard()}
          </Link>
        </div>
      </div>
    </HomeLayout>
  )
}
