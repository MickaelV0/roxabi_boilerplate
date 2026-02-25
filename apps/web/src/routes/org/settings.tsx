import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/org/settings')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/settings' })
  },
})
