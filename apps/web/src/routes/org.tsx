import { Tabs, TabsList, TabsTrigger } from '@repo/ui'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/org')({
  component: OrgLayout,
})

function OrgLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeTab = pathname.includes('/org/members') ? 'members' : 'settings'

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="settings" asChild>
            <Link to="/org/settings">{m.org_tab_settings()}</Link>
          </TabsTrigger>
          <TabsTrigger value="members" asChild>
            <Link to="/org/members">{m.org_tab_members()}</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  )
}
