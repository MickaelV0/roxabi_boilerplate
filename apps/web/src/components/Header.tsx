import { Button } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { ExternalLink, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { m } from '@/paraglide/messages'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

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
            <a href="/docs">{m.nav_docs()}</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        {/* Right side: switchers + mobile toggle */}
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
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
              <a href="/docs">{m.nav_docs()}</a>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <a
                href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
