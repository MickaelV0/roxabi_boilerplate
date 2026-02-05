import { Button, Separator } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { BookOpen, Github, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Roxabi</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href="/docs">
              <BookOpen className="mr-2 h-4 w-4" />
              Docs
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/demo/form/steps">Form Demo</Link>
          </Button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <a
              href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="/docs">Get Started</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="mx-auto max-w-5xl px-6 py-4 space-y-4">
            <div className="grid gap-2">
              <a href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
                Documentation
              </a>
              <Link
                to="/demo/form/steps"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Form Demo
              </Link>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a
                  href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <a href="/docs">Get Started</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
