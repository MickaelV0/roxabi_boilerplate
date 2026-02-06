import { Button } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function CtaSection() {
  return (
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
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
