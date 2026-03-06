import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function KillDarlingsSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 bottom-0 h-[250px] w-[400px] -translate-x-1/2 translate-y-1/4 rounded-full bg-rose-500/6 blur-[100px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-rose-400 uppercase">
            {m.talk_lp_kill_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-rose-300">
            {m.talk_lp_kill_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="relative overflow-hidden rounded-xl border border-rose-400/30 bg-rose-500/5 max-w-xl">
            {/* Commit log header */}
            <div className="border-b border-rose-400/20 px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-widest text-rose-400 uppercase">
                GIT LOG
              </span>
              <Badge className="border border-rose-400/60 bg-rose-500/20 text-rose-300 font-mono text-[9px] tracking-widest uppercase">
                {m.talk_lp_kill_badge()}
              </Badge>
            </div>

            <div className="px-5 py-5 space-y-3">
              <div className="rounded bg-black/30 px-3 py-2 border border-rose-400/15">
                <p className="font-mono text-[11px] text-rose-300/80">{m.talk_lp_kill_commit()}</p>
              </div>
              <p className="font-mono text-xs text-rose-400/60 uppercase tracking-wider">
                {m.talk_lp_kill_label()}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <div className="flex items-start gap-3 max-w-xl">
            <Badge className="mt-0.5 flex-shrink-0 border border-amber-400/50 bg-amber-500/10 text-amber-300 font-mono text-[9px] tracking-widest uppercase">
              {m.talk_lp_kill_lesson_label()}
            </Badge>
            <p className="text-lg font-semibold text-amber-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_kill_lesson()}&rdquo;
            </p>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
