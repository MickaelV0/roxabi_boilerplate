import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function VoiceSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/6 blur-[150px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-cyan-400 uppercase">
            {m.talk_lp_voice_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-cyan-300">
            {m.talk_lp_voice_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="flex items-center gap-4 max-w-xl">
            {/* Before */}
            <div className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/5 p-5 text-center">
              <p className="font-mono text-[9px] text-rose-400 uppercase tracking-widest mb-2">
                {m.talk_lp_voice_before_label()}
              </p>
              <p className="font-mono text-3xl font-bold text-rose-300 line-through opacity-70">
                ~15s
              </p>
              <p className="font-mono text-[10px] text-rose-400/50 mt-1">
                {m.talk_lp_voice_before()}
              </p>
            </div>

            <div className="flex items-center">
              <span className="font-mono text-cyan-400 text-xl">→</span>
            </div>

            {/* After */}
            <div className="flex-1 rounded-lg border border-cyan-400/30 bg-cyan-500/8 p-5 text-center">
              <p className="font-mono text-[9px] text-cyan-400 uppercase tracking-widest mb-2">
                {m.talk_lp_voice_after_label()}
              </p>
              <p className="font-mono text-3xl font-bold text-cyan-300">~2-3s</p>
              <p className="font-mono text-[10px] text-cyan-400/50 mt-1">
                {m.talk_lp_voice_after()}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <Badge className="border border-cyan-400/50 bg-cyan-500/10 text-cyan-300 font-mono text-[10px] tracking-widest">
            {m.talk_lp_voice_stat()}
          </Badge>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_voice_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-cyan-500/40 pl-4">
            <p className="text-lg font-semibold text-cyan-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_voice_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
