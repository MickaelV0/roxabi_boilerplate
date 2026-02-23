import { Button } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { BookOpenIcon, Menu, X } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useOrganizations } from '@/lib/use-organizations'
import { m } from '@/paraglide/messages'
import { GithubIcon } from './GithubIcon'
import { LocaleSwitcher } from './LocaleSwitcher'
import { Logo } from './Logo'
import { OrgSwitcher } from './OrgSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function Header() {
  const { data: session } = useSession()
  // Pass session user ID so orgs refetch after login/logout
  const orgState = useOrganizations(session?.user?.id)
  // Show auth section only when both session and orgs are resolved to avoid incremental rendering
  const authReady = session && orgState.data !== undefined
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [mobileOpen])

  return (
    <Collapsible.Root open={mobileOpen} onOpenChange={setMobileOpen} asChild>
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link to="/" className="text-foreground hover:opacity-80 transition-opacity">
            <Logo />
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link
                to="/"
                activeProps={{ className: 'bg-accent font-medium' }}
                activeOptions={{ exact: true }}
              >
                {m.nav_home()}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/design-system" activeProps={{ className: 'bg-accent font-medium' }}>
                {m.nav_design_system()}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/talks/claude-code">{m.nav_talks()}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/docs/$" params={{ _splat: '' }}>
                <BookOpenIcon className="size-4" />
                {m.nav_docs()}
              </Link>
            </Button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
            <GithubIcon />
            {authReady ? (
              <div className="hidden items-center gap-1 md:flex">
                <OrgSwitcher orgState={orgState} />
                <UserMenu />
              </div>
            ) : !session ? (
              <div className="hidden items-center gap-1 md:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">{m.nav_sign_in()}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">{m.nav_sign_up()}</Link>
                </Button>
              </div>
            ) : null}
            {authReady && (
              <div className="md:hidden">
                <UserMenu />
              </div>
            )}
            <Collapsible.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={mobileOpen ? m.menu_close() : m.menu_open()}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </Collapsible.Trigger>
          </div>
        </nav>

        {/* Mobile panel */}
        <Collapsible.Content
          ref={mobileRef}
          className="overflow-hidden border-t border-border bg-background md:hidden data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out-0"
        >
          <div className="flex flex-col gap-2 px-6 py-4">
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link
                to="/"
                activeProps={{ className: 'bg-accent font-medium' }}
                activeOptions={{ exact: true }}
                onClick={() => setMobileOpen(false)}
              >
                {m.nav_home()}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link
                to="/design-system"
                activeProps={{ className: 'bg-accent font-medium' }}
                onClick={() => setMobileOpen(false)}
              >
                {m.nav_design_system()}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link to="/talks/claude-code" onClick={() => setMobileOpen(false)}>
                {m.nav_talks()}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link to="/docs/$" params={{ _splat: '' }} onClick={() => setMobileOpen(false)}>
                <BookOpenIcon className="size-4" />
                {m.nav_docs()}
              </Link>
            </Button>
            {!session && (
              <>
                <hr className="my-1 border-border" />
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    {m.nav_sign_in()}
                  </Link>
                </Button>
                <Button size="sm" className="justify-start" asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    {m.nav_sign_up()}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </Collapsible.Content>
      </header>
    </Collapsible.Root>
  )
}
