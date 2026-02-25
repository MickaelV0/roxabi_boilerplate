import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/org/members')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/members' })
  },
})
