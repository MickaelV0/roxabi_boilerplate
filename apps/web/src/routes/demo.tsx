import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { clientEnv } from '@/lib/env.shared.js'

export const Route = createFileRoute('/demo')({
  beforeLoad: () => {
    if (clientEnv.VITE_ENABLE_DEMO !== 'true') {
      throw notFound()
    }
  },
  component: DemoLayout,
})

function DemoLayout() {
  return <Outlet />
}
