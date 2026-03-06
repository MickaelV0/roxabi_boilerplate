import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function IndustrialTurnSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-amber-500/6 blur-[120px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-amber-400 uppercase">
            {m.talk_lp_process_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-amber-300">
            {m.talk_lp_process_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="flex items-stretch gap-4 max-w-xl">
            {/* Before */}
            <div className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/5 p-4">
              <p className="font-mono text-[9px] text-rose-400 uppercase tracking-widest mb-3">
                {m.talk_lp_process_rule1_label()}
              </p>
              <p className="font-mono text-base text-rose-300 font-semibold italic">
                {m.talk_lp_process_rule1()}
              </p>
            </div>

            <div className="flex items-center">
              <span className="font-mono text-amber-400 text-xl">→</span>
            </div>

            {/* After */}
            <div className="flex-1 rounded-lg border border-amber-400/30 bg-amber-500/8 p-4">
              <p className="font-mono text-[9px] text-amber-400 uppercase tracking-widest mb-3">
                {m.talk_lp_process_rule2_label()}
              </p>
              <p className="font-mono text-base text-amber-300 font-bold">
                {m.talk_lp_process_rule2()}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <Badge className="border border-amber-400/50 bg-amber-500/10 text-amber-300 font-mono text-[10px] tracking-widest">
            {m.talk_lp_process_stat()}
          </Badge>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_process_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <p className="max-w-xl font-mono text-xs text-amber-400/50 italic">
            {m.talk_lp_process_milestone()}
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}
