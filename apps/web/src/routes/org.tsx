import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/org')({
  beforeLoad: () => {
    // Redirect /org to /admin to prevent layout flash.
    // Child routes (/org/settings, /org/members) have their own redirects.
    throw redirect({ to: '/admin' })
  },
  component: OrgRedirectShell,
})

/** Fallback shell that renders children while redirect is in progress. */
function OrgRedirectShell() {
  return <Outlet />
}
