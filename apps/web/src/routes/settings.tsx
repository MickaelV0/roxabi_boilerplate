import { cn } from '@repo/ui'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { requireAuth } from '@/lib/route-guards'

export const Route = createFileRoute('/settings')({
  beforeLoad: requireAuth,
  component: SettingsLayout,
})

function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAccount = pathname.includes('/settings/account')

  // TODO: implement — settings layout with sidebar navigation
  // Tabs: Profile, Account
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <nav className="flex gap-2 border-b pb-2" aria-label="Settings">
        <Link
          to="/settings/profile"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            !isAccount ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={!isAccount ? 'page' : undefined}
        >
          Profile
        </Link>
        <Link
          to="/settings/account"
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            isAccount ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={isAccount ? 'page' : undefined}
        >
          Account
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}
