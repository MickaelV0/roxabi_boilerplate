import { Link } from '@tanstack/react-router'
import { GITHUB_REPO_URL } from '@/lib/config'
import { m } from '@/paraglide/messages'

const CURRENT_YEAR = new Date().getFullYear().toString()

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {m.footer_copyright({ year: CURRENT_YEAR })}
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/docs/$"
            params={{ _splat: 'changelog' }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {m.footer_changelog()}
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {m.github_label()}
          </a>
        </div>
      </div>
    </footer>
  )
}
