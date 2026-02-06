import { Button } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-border py-24">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-muted/50 to-chart-1/5 dark:from-primary/10 dark:via-muted/30 dark:to-chart-1/10" />

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{m.cta_title()}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{m.cta_subtitle()}</p>
        <div className="mt-8">
          <Button size="lg" asChild>
            <a href="/docs">{m.cta_button()}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
