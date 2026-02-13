import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/talks')({
  component: TalksLayout,
  head: () => ({
    meta: [
      {
        name: 'robots',
        content: 'noindex',
      },
    ],
  }),
})

function TalksLayout() {
  return <Outlet />
}
