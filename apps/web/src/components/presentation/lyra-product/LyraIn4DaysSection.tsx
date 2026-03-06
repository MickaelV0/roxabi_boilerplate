import { AnimatedSection } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function LyraIn4DaysSection() {
  const timeline = [
    m.talk_lp_outcome_j1(),
    m.talk_lp_outcome_j2(),
    m.talk_lp_outcome_j3(),
    m.talk_lp_outcome_j4(),
  ]

  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/8 blur-[150px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-orange-400 uppercase">
            {m.talk_lp_outcome_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-orange-300">
            {m.talk_lp_outcome_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="flex items-center gap-6 mb-6">
            <div className="font-mono text-6xl font-bold bg-gradient-to-br from-amber-300 to-orange-400 bg-clip-text text-transparent">
              52 → 4
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="max-w-xl space-y-2">
            {timeline.map((entry) => {
              const colonIdx = entry.indexOf(':')
              const day = colonIdx !== -1 ? entry.slice(0, colonIdx) : entry
              const desc = colonIdx !== -1 ? entry.slice(colonIdx + 1).trim() : ''
              return (
                <div key={entry} className="flex items-start gap-3">
                  <span className="font-mono text-[10px] text-orange-400 mt-1 flex-shrink-0 w-8">
                    {day}
                  </span>
                  <span className="text-sm text-muted-foreground/70 leading-relaxed">{desc}</span>
                </div>
              )
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_outcome_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-amber-500/40 pl-4">
            <p className="text-lg font-semibold text-amber-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_outcome_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
