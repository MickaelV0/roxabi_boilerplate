import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { BookOpenIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { authClient, useSession } from '@/lib/auth-client'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
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
          <CardTitle className="text-2xl">Welcome back, {userName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {activeOrg
              ? `You are working in the ${activeOrg.name} organization.`
              : 'Select or create an organization to get started with your team.'}
          </p>
        </CardContent>
      </Card>

      {/* Quick actions grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <SettingsIcon className="size-4 text-muted-foreground" />
                Org Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Manage your organization name, slug, and configuration.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/org/settings">Open Settings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersIcon className="size-4 text-muted-foreground" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Invite members, manage roles, and organize your team.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/org/members">View Members</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpenIcon className="size-4 text-muted-foreground" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Browse guides, API references, and getting started docs.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/docs/$" params={{ _splat: '' }}>
                  Read Docs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
