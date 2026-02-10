import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/demo')({
  beforeLoad: () => {
    if (import.meta.env.VITE_ENABLE_DEMO !== 'true') {
      throw notFound()
    }
  },
  component: DemoLayout,
})

function DemoLayout() {
  return <Outlet />
}
