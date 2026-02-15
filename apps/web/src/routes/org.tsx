import { cn } from '@repo/ui'
import { createFileRoute, Link, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/org')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') return
    const { data } = await authClient.getSession()
    if (!data) {
      throw redirect({ to: '/login' })
    }
  },
  component: OrgLayout,
})

function OrgLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isMembers = pathname.includes('/org/members')

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <nav className="flex gap-2 border-b pb-2" aria-label="Organization">
        <Link
          to="/org/settings"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            !isMembers ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={!isMembers ? 'page' : undefined}
        >
          {m.org_tab_settings()}
        </Link>
        <Link
          to="/org/members"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            isMembers ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={isMembers ? 'page' : undefined}
        >
          {m.org_tab_members()}
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}
