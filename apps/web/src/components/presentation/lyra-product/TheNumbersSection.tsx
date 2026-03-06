import { AnimatedSection } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function TheNumbersSection() {
  const stats = [
    { value: m.talk_lp_numbers_stat1(), label: m.talk_lp_numbers_stat1_label() },
    { value: m.talk_lp_numbers_stat2(), label: m.talk_lp_numbers_stat2_label() },
    { value: m.talk_lp_numbers_stat3(), label: m.talk_lp_numbers_stat3_label() },
    { value: m.talk_lp_numbers_stat4(), label: m.talk_lp_numbers_stat4_label() },
    { value: m.talk_lp_numbers_stat5(), label: m.talk_lp_numbers_stat5_label() },
    { value: m.talk_lp_numbers_stat6(), label: m.talk_lp_numbers_stat6_label() },
  ]

  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-amber-500/6 blur-[120px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-8 font-mono text-amber-300">
            {m.talk_lp_numbers_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="grid grid-cols-2 gap-4 max-w-xl sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-amber-400/30 bg-amber-500/5 p-4 text-center"
              >
                <p className="font-mono text-4xl font-bold text-amber-300 mb-1">{stat.value}</p>
                <p className="font-mono text-[10px] text-amber-400/60 uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-amber-500/40 pl-4">
            <p className="text-lg font-semibold text-amber-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_numbers_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
