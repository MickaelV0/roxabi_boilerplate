import { baseOptions } from '@/lib/layout.shared'
import { Link, createFileRoute } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col flex-1 justify-center px-4 py-8 text-center">
        <h1 className="font-medium text-2xl mb-4">Roxabi Boilerplate</h1>
        <p className="text-fd-muted-foreground mb-8">SaaS framework with integrated AI team</p>
        <Link
          to="/docs/$"
          params={{
            _splat: '',
          }}
          className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm mx-auto"
        >
          Open Documentation
        </Link>
      </div>
    </HomeLayout>
  )
}
