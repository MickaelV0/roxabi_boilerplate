import { AnimatedSection } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function TheDaySection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/8 blur-[150px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-orange-400 uppercase">
            {m.talk_lp_day_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-4 font-mono text-orange-300">
            {m.talk_lp_day_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-2">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed mb-6">
            {m.talk_lp_day_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="grid grid-cols-1 gap-3 max-w-xl sm:grid-cols-3">
            <div className="rounded-lg border border-orange-400/30 bg-orange-500/5 p-4">
              <p className="font-mono text-[10px] text-orange-400 uppercase tracking-widest mb-2">
                {m.talk_lp_day_item1_label()}
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {m.talk_lp_day_item1()}
              </p>
            </div>
            <div className="rounded-lg border border-orange-400/30 bg-orange-500/5 p-4">
              <p className="font-mono text-[10px] text-orange-400 uppercase tracking-widest mb-2">
                {m.talk_lp_day_item2_label()}
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {m.talk_lp_day_item2()}
              </p>
            </div>
            <div className="rounded-lg border border-orange-400/30 bg-orange-500/5 p-4">
              <p className="font-mono text-[10px] text-orange-400 uppercase tracking-widest mb-2">
                {m.talk_lp_day_item3_label()}
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {m.talk_lp_day_item3()}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-amber-500/40 pl-4">
            <p className="text-lg font-semibold text-amber-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_day_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
