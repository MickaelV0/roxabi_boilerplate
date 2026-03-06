import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function PivotSpeedSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-orange-500/6 blur-[120px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-orange-400 uppercase">
            {m.talk_lp_pivot_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-orange-300">
            {m.talk_lp_pivot_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="flex items-center gap-4 max-w-xl">
            {/* MCP — before */}
            <div className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/5 p-4 text-center">
              <p className="font-mono text-xs text-rose-400/60 uppercase tracking-wider mb-1">
                MCP
              </p>
              <p className="font-mono text-xl font-bold text-rose-300 line-through opacity-60">
                Google Workspace
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="h-px w-8 bg-orange-400/40" />
              <span className="font-mono text-orange-400 text-lg">→</span>
              <div className="h-px w-8 bg-orange-400/40" />
            </div>

            {/* Python direct — after */}
            <div className="flex-1 rounded-lg border border-amber-400/30 bg-amber-500/8 p-4 text-center">
              <p className="font-mono text-xs text-amber-400/60 uppercase tracking-wider mb-1">
                Python
              </p>
              <p className="font-mono text-xl font-bold text-amber-300">direct</p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <Badge className="border border-orange-400/50 bg-orange-500/10 text-orange-300 font-mono text-[10px] tracking-widest">
            {m.talk_lp_pivot_stat()}
          </Badge>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-amber-500/40 pl-4">
            <p className="text-lg font-semibold text-amber-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_pivot_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_pivot_body()}
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}
