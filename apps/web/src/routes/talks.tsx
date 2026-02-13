import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/talks')({
  component: TalksLayout,
})

function TalksLayout() {
  return <Outlet />
}
