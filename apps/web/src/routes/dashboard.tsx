import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { BookOpenIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { authClient, useSession } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') return
    const { data } = await authClient.getSession()
    if (!data) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard | Roxabi' }],
  }),
})

function DashboardPage() {
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const userName = session?.user?.name ?? 'User'

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Welcome card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{m.dashboard_welcome({ name: userName })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {activeOrg ? m.dashboard_org_context({ name: activeOrg.name }) : m.dashboard_no_org()}
          </p>
        </CardContent>
      </Card>

      {/* Quick actions grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{m.dashboard_quick_actions()}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <SettingsIcon className="size-4 text-muted-foreground" />
                {m.dashboard_org_settings()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {m.dashboard_org_settings_desc()}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/org/settings">{m.dashboard_open_settings()}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersIcon className="size-4 text-muted-foreground" />
                {m.dashboard_team_members()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {m.dashboard_team_members_desc()}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/org/members">{m.dashboard_view_members()}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpenIcon className="size-4 text-muted-foreground" />
                {m.dashboard_documentation()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {m.dashboard_documentation_desc()}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/docs/$" params={{ _splat: '' }}>
                  {m.dashboard_read_docs()}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
