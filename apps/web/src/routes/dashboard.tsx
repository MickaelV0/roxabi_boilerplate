import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { BookOpenIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchUserProfile } from '@/lib/api'
import { authClient, useSession } from '@/lib/auth-client'
import { requireAuth } from '@/lib/route-guards'
import { useOrganizations } from '@/lib/use-organizations'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard | Roxabi' }],
  }),
})

function DashboardPage() {
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: orgs, isLoading: orgsLoading } = useOrganizations()
  const autoSelectAttempted = useRef(false)
  const accountCheckDone = useRef(false)
  const [accountChecked, setAccountChecked] = useState(false)
  const navigate = useNavigate()

  // Track previous orgs length to reset autoSelectAttempted when list changes
  const prevOrgsLength = useRef<number | undefined>(undefined)

  // Check if user account is scheduled for deletion
  useEffect(() => {
    if (accountCheckDone.current) {
      setAccountChecked(true)
      return
    }

    const controller = new AbortController()
    async function checkAccountStatus() {
      try {
        const res = await fetchUserProfile(controller.signal)
        if (!res.ok) return
        const profile = (await res.json()) as Record<string, unknown>
        if (profile.deletedAt) {
          navigate({
            to: '/account-reactivation',
            search: {
              deleteScheduledFor: profile.deleteScheduledFor as string | undefined,
            },
          })
        }
      } catch {
        // Non-blocking: profile check is best-effort
      } finally {
        if (!controller.signal.aborted) {
          accountCheckDone.current = true
          setAccountChecked(true)
        }
      }
    }
    checkAccountStatus()
    return () => controller.abort()
  }, [navigate])

  // Auto-select first org if none is active or active org is not in user's list
  useEffect(() => {
    if (!accountChecked || !orgs) return

    // Reset autoSelectAttempted when orgs list length changes
    if (prevOrgsLength.current !== undefined && prevOrgsLength.current !== orgs.length) {
      autoSelectAttempted.current = false
    }
    prevOrgsLength.current = orgs.length

    if (autoSelectAttempted.current) return
    const activeOrgValid = activeOrg && orgs.some((org) => org.id === activeOrg.id)
    if (activeOrgValid) return
    const firstOrg = orgs[0]
    autoSelectAttempted.current = true
    if (firstOrg) {
      authClient.organization.setActive({ organizationId: firstOrg.id }).catch(() => {})
    } else if (activeOrg) {
      // User has a stale active org but no valid orgs -- clear it
      authClient.organization.setActive({ organizationId: '' }).catch(() => {})
    }
  }, [accountChecked, activeOrg, orgs])

  // Show loading skeleton until session and org list are resolved
  if (!session || orgsLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    )
  }

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
