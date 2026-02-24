import { Button, cn, Separator } from '@repo/ui'
import { createFileRoute, Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
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
import { enforceRoutePermission, useCanAccess } from '@/lib/route-permissions'
import { m } from '@/paraglide/messages'

function AdminErrorBoundary({ error }: { error: Error }) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => router.history.back()}>
          Go back
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.invalidate()}>
          Try again
        </Button>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/admin')({
  staticData: { permission: 'members:write' },
  beforeLoad: enforceRoutePermission,
  component: AdminLayout,
  errorComponent: AdminErrorBoundary,
})

type SidebarLink = {
  to: string
  label: () => string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const ORG_LINKS: SidebarLink[] = [
  { to: '/admin/members', label: () => m.admin_sidebar_link_members(), icon: UsersIcon },
  { to: '/admin/settings', label: () => m.admin_sidebar_link_settings(), icon: SettingsIcon },
]

const SYSTEM_LINKS: SidebarLink[] = [
  {
    to: '/admin/users',
    label: () => m.admin_sidebar_link_users(),
    icon: ShieldIcon,
  },
  {
    to: '/admin/organizations',
    label: () => m.admin_sidebar_link_organizations(),
    icon: BuildingIcon,
  },
  {
    to: '/admin/system-settings',
    label: () => m.admin_sidebar_link_system_settings(),
    icon: SettingsIcon,
    disabled: true,
  },
  {
    to: '/admin/feature-flags',
    label: () => m.admin_sidebar_link_feature_flags(),
    icon: FlagIcon,
    disabled: true,
  },
  {
    to: '/admin/health',
    label: () => m.admin_sidebar_link_health(),
    icon: HeartPulseIcon,
    disabled: true,
  },
  {
    to: '/admin/audit-logs',
    label: () => m.admin_sidebar_link_audit_logs(),
    icon: ScrollTextIcon,
  },
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
              <span>{link.label()}</span>
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
            <span>{link.label()}</span>
          </Link>
        )
      })}
    </div>
  )
}

function MobileNavLink({ link, pathname }: { link: SidebarLink; pathname: string }) {
  const Icon = link.icon
  const isActive = pathname.startsWith(link.to)

  if (link.disabled) {
    return (
      <span className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed">
        <Icon className="size-4" />
        {link.label()}
      </span>
    )
  }

  return (
    <Link
      to={link.to}
      className={cn(
        'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="size-4" />
      {link.label()}
    </Link>
  )
}

function AdminDesktopSidebar({ pathname, superAdmin }: { pathname: string; superAdmin: boolean }) {
  return (
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
  )
}

function AdminMobileNav({ pathname, superAdmin }: { pathname: string; superAdmin: boolean }) {
  const visibleOrgLinks = ORG_LINKS.filter((l) => !l.disabled)

  return (
    <nav
      className="flex gap-2 overflow-x-auto border-b px-4 py-2 md:hidden"
      aria-label="Admin navigation"
    >
      {visibleOrgLinks.map((link) => (
        <MobileNavLink key={link.to} link={link} pathname={pathname} />
      ))}
      {superAdmin &&
        SYSTEM_LINKS.map((link) => <MobileNavLink key={link.to} link={link} pathname={pathname} />)}
    </nav>
  )
}

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const superAdmin = useCanAccess('/admin/users')

  return (
    <div className="mx-auto flex max-w-7xl gap-0 p-0 md:gap-6 md:p-6">
      <AdminDesktopSidebar pathname={pathname} superAdmin={superAdmin} />
      <AdminMobileNav pathname={pathname} superAdmin={superAdmin} />
      <main className="min-w-0 flex-1 p-4 md:p-0">
        <Outlet />
      </main>
    </div>
  )
}
