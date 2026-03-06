import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function LyraNotSoleneSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-amber-500/6 blur-[120px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-2 font-mono text-amber-300">
            {m.talk_lp_identity_title()}
          </h2>
          <Badge className="border border-amber-400/50 bg-amber-500/10 text-amber-300 font-mono text-[10px] tracking-widest mb-6 inline-block">
            {m.talk_lp_identity_label()}
          </Badge>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="flex items-stretch gap-4 max-w-xl">
            {/* Tested — Solene */}
            <div className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/5 p-5 text-center">
              <p className="font-mono text-[9px] text-rose-400 uppercase tracking-widest mb-3">
                {m.talk_lp_identity_wrong_label()}
              </p>
              <p className="font-mono text-3xl font-bold text-rose-300 line-through opacity-60">
                {m.talk_lp_identity_wrong()}
              </p>
            </div>

            <div className="flex items-center">
              <span className="font-mono text-amber-400 text-xl">→</span>
            </div>

            {/* The answer — Lyra */}
            <div className="flex-1 rounded-lg border border-amber-400/30 bg-amber-500/8 p-5 text-center">
              <p className="font-mono text-[9px] text-amber-400 uppercase tracking-widest mb-3">
                {m.talk_lp_identity_right_label()}
              </p>
              <p className="font-mono text-3xl font-bold text-amber-300">
                {m.talk_lp_identity_right()}
              </p>
              <p className="font-mono text-[10px] text-amber-400/50 mt-2 italic">
                {m.talk_lp_identity_right_body()}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_identity_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-amber-500/40 pl-4">
            <p className="text-lg font-semibold text-amber-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_identity_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
