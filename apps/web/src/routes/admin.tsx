import { cn, Separator } from '@repo/ui'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  ActivityIcon,
  BuildingIcon,
  FlagIcon,
  HeartPulseIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin-guards'
import { useSession } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/admin')({
  beforeLoad: requireAdmin,
  component: AdminLayout,
})

type SidebarLink = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const ORG_LINKS: SidebarLink[] = [
  { to: '/admin/members', label: 'Members', icon: UsersIcon },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

const SYSTEM_LINKS: SidebarLink[] = [
  { to: '/admin/users', label: 'Users', icon: ShieldIcon, disabled: true },
  { to: '/admin/organizations', label: 'Organizations', icon: BuildingIcon, disabled: true },
  { to: '/admin/system-settings', label: 'System Settings', icon: SettingsIcon, disabled: true },
  { to: '/admin/feature-flags', label: 'Feature Flags', icon: FlagIcon, disabled: true },
  { to: '/admin/health', label: 'Health', icon: HeartPulseIcon, disabled: true },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollTextIcon, disabled: true },
]

function SidebarGroup({
  title,
  links,
  pathname,
}: {
  title: string
  links: SidebarLink[]
  pathname: string
}) {
  return (
    <div className="space-y-1">
      <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname.startsWith(link.to)

        if (link.disabled) {
          return (
            <span
              key={link.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed"
            >
              <Icon className="size-4" />
              <span>{link.label}</span>
              <span className="ml-auto text-[10px] font-medium uppercase tracking-wide opacity-60">
                {m.admin_sidebar_soon()}
              </span>
            </span>
          )
        }

        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="size-4" />
            <span>{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

function isSuperAdmin(session: { user?: Record<string, unknown> } | null | undefined): boolean {
  if (!session?.user) return false
  return session.user.role === 'superadmin'
}

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: session } = useSession()
  const superAdmin = isSuperAdmin(session as { user?: Record<string, unknown> } | null)

  return (
    <div className="mx-auto flex max-w-7xl gap-0 p-0 md:gap-6 md:p-6">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 md:block">
        <nav className="sticky top-20 space-y-6" aria-label="Admin navigation">
          <div className="flex items-center gap-2 px-3">
            <ActivityIcon className="size-5 text-foreground" />
            <h2 className="text-lg font-semibold">{m.admin_sidebar_title()}</h2>
          </div>
          <Separator />
          <SidebarGroup
            title={m.admin_sidebar_organization()}
            links={ORG_LINKS}
            pathname={pathname}
          />
          {superAdmin && (
            <>
              <Separator />
              <SidebarGroup
                title={m.admin_sidebar_system()}
                links={SYSTEM_LINKS}
                pathname={pathname}
              />
            </>
          )}
        </nav>
      </aside>

      {/* Mobile navigation */}
      <nav
        className="flex gap-2 overflow-x-auto border-b px-4 py-2 md:hidden"
        aria-label="Admin navigation"
      >
        {ORG_LINKS.filter((l) => !l.disabled).map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.to)
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          )
        })}
        {superAdmin &&
          SYSTEM_LINKS.map((link) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.to)

            if (link.disabled) {
              return (
                <span
                  key={link.to}
                  className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed"
                >
                  <Icon className="size-4" />
                  {link.label}
                </span>
              )
            }

            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            )
          })}
      </nav>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-4 md:p-0">
        <Outlet />
      </main>
    </div>
  )
}
