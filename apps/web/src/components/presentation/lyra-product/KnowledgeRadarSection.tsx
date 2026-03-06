import { AnimatedSection } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function KnowledgeRadarSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/6 blur-[150px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-cyan-400 uppercase">
            {m.talk_lp_radar_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-2 font-mono text-cyan-300">
            {m.talk_lp_radar_title()}
          </h2>
          <p className="font-mono text-xs text-cyan-400/50 mb-6">{m.talk_lp_radar_subtitle()}</p>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/5 p-4 text-center">
              <p className="font-mono text-xs text-cyan-400/60 uppercase tracking-wider mb-2">
                {m.talk_lp_radar_stat1_label()}
              </p>
              <p className="font-mono text-4xl font-bold text-cyan-300">
                {m.talk_lp_radar_stat1()}
              </p>
            </div>
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/5 p-4 text-center">
              <p className="font-mono text-xs text-cyan-400/60 uppercase tracking-wider mb-2">
                {m.talk_lp_radar_stat2_label()}
              </p>
              <p className="font-mono text-4xl font-bold text-cyan-300">
                {m.talk_lp_radar_stat2()}
              </p>
            </div>
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/5 p-4 text-center">
              <p className="font-mono text-xs text-cyan-400/60 uppercase tracking-wider mb-2">
                {m.talk_lp_radar_stat3_label()}
              </p>
              <p className="font-mono text-4xl font-bold text-cyan-300">
                {m.talk_lp_radar_stat3()}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_radar_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-cyan-500/40 pl-4">
            <p className="text-lg font-semibold text-cyan-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_radar_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
