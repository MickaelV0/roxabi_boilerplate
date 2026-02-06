import { m } from '@/paraglide/messages'

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {m.footer_copyright({ year: new Date().getFullYear().toString() })}
        </p>
        <a
          href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}
