import { Button } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { BookOpenIcon, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { GithubIcon } from './GithubIcon'
import { LocaleSwitcher } from './LocaleSwitcher'
import { OrgSwitcher } from './OrgSwitcher'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const { data: session } = useSession()
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          Roxabi
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" activeProps={{ className: 'bg-accent' }} activeOptions={{ exact: true }}>
              {m.nav_home()}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/demo" activeProps={{ className: 'bg-accent' }}>
              {m.nav_demos()}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/design-system" activeProps={{ className: 'bg-accent' }}>
              Design System
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/docs">
              <BookOpenIcon className="size-4" />
              {m.nav_docs()}
            </a>
          </Button>
        </div>

        {/* Right side: switchers + mobile toggle */}
        <div className="flex items-center gap-1">
          {session && <OrgSwitcher />}
          <LocaleSwitcher />
          <ThemeToggle />
          <GithubIcon />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? m.menu_close() : m.menu_open()}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile panel */}
      {mobileOpen && (
        <div ref={mobileRef} className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link
                to="/"
                activeProps={{ className: 'bg-accent' }}
                activeOptions={{ exact: true }}
                onClick={() => setMobileOpen(false)}
              >
                {m.nav_home()}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link
                to="/demo"
                activeProps={{ className: 'bg-accent' }}
                onClick={() => setMobileOpen(false)}
              >
                {m.nav_demos()}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link
                to="/design-system"
                activeProps={{ className: 'bg-accent' }}
                onClick={() => setMobileOpen(false)}
              >
                Design System
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <a href="/docs" onClick={() => setMobileOpen(false)}>
                <BookOpenIcon className="size-4" />
                {m.nav_docs()}
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
