import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function TheNightSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/8 blur-[150px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-rose-400 uppercase">
            {m.talk_lp_night_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-rose-300">
            {m.talk_lp_night_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 max-w-xl overflow-hidden">
            <div className="px-5 py-4 space-y-3">
              {[
                m.talk_lp_night_t1(),
                m.talk_lp_night_t2(),
                m.talk_lp_night_t3(),
                m.talk_lp_night_t4(),
                m.talk_lp_night_t5(),
              ].map((entry) => {
                const [time, ...rest] = entry.split(' — ')
                return (
                  <div key={entry} className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-rose-400 mt-0.5 flex-shrink-0 w-10">
                      {time}
                    </span>
                    <span className="text-sm text-muted-foreground/70 leading-relaxed">
                      {rest.join(' — ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <Badge className="border border-rose-400/50 bg-rose-500/10 text-rose-300 font-mono text-[10px] tracking-widest">
            {m.talk_lp_night_stat()}
          </Badge>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-rose-500/40 pl-4">
            <p className="text-lg font-semibold text-rose-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_night_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
