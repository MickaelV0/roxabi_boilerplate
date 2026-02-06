import { Badge, Button } from '@repo/ui'
import { ExternalLink } from 'lucide-react'
import { m } from '@/paraglide/messages'

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:py-32">
      <Badge variant="secondary" className="mb-6">
        {m.hero_badge()}
      </Badge>
      <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {m.hero_title()}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{m.hero_subtitle()}</p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <Button size="lg" asChild>
          <a href="/docs">{m.hero_cta_start()}</a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            {m.hero_cta_github()}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Stats */}
      <div className="mx-auto mt-16 flex max-w-2xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
        <div className="text-center">
          <p className="text-3xl font-bold">{m.stat_setup()}</p>
          <p className="mt-1 text-sm text-muted-foreground">{m.stat_setup_label()}</p>
        </div>
        <div className="hidden h-12 w-px bg-border sm:block" />
        <div className="text-center">
          <p className="text-3xl font-bold">{m.stat_config()}</p>
          <p className="mt-1 text-sm text-muted-foreground">{m.stat_config_label()}</p>
        </div>
        <div className="hidden h-12 w-px bg-border sm:block" />
        <div className="text-center">
          <p className="text-3xl font-bold">{m.stat_production()}</p>
          <p className="mt-1 text-sm text-muted-foreground">{m.stat_production_label()}</p>
        </div>
      </div>
    </section>
  )
}
