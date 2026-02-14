import { Badge, Button } from '@repo/ui'
import { ExternalLink } from 'lucide-react'
import { GITHUB_REPO_URL } from '@/lib/config'
import { m } from '@/paraglide/messages'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px] dark:bg-primary/20" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/3 rounded-full bg-chart-1/10 blur-[120px] dark:bg-chart-1/15" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 text-center lg:py-32">
        <div className="animate-hero-in">
          <Badge variant="secondary" className="mb-6">
            {m.hero_badge()}
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {m.hero_title()}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {m.hero_subtitle()}
          </p>
        </div>

        <div className="animate-hero-in-delayed mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <a href="/docs">{m.hero_cta_start()}</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a
              href={GITHUB_REPO_URL}
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
        <div className="animate-hero-in-delayed mx-auto mt-16 flex max-w-2xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
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
      </div>
    </section>
  )
}
