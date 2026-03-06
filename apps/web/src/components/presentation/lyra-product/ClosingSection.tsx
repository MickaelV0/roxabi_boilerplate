import { AnimatedSection, Badge } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'

export function ClosingSection() {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[200px]" />
        <div className="absolute left-1/3 bottom-1/4 h-[200px] w-[200px] rounded-full bg-orange-500/6 blur-[100px]" />
      </div>

      <div className="relative space-y-8 py-4">
        <AnimatedSection>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl font-mono text-amber-300">
            {m.talk_lp_closing_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection>
          <p className="mx-auto max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_closing_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <p className="mx-auto max-w-2xl text-2xl font-bold italic text-amber-300 lg:text-3xl">
            &ldquo;{m.talk_lp_closing_cta()}&rdquo;
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="flex flex-col items-center gap-3">
            <Badge className="border border-amber-400/50 bg-amber-500/10 text-amber-300 font-mono text-[10px] tracking-widest">
              {m.talk_lp_closing_links_label()}
            </Badge>
            <p className="font-mono text-xs text-muted-foreground/50">
              {m.talk_lp_closing_contact()}
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <Link
            to="/talks"
            className="font-mono text-[10px] text-amber-400/40 hover:text-amber-400/70 transition-colors tracking-widest uppercase"
          >
            ← /talks
          </Link>
        </AnimatedSection>
      </div>
    </div>
  )
}
