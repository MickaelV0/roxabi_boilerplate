import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function TheEcosystemSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/6 blur-[150px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-2 font-mono text-cyan-300">
            {m.talk_lp_ecosystem_title()}
          </h2>
          <Badge className="border border-cyan-400/50 bg-cyan-500/10 text-cyan-300 font-mono text-[10px] tracking-widest mb-6 inline-block">
            {m.talk_lp_ecosystem_label()}
          </Badge>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="max-w-xl space-y-3">
            {[
              m.talk_lp_ecosystem_repo1(),
              m.talk_lp_ecosystem_repo2(),
              m.talk_lp_ecosystem_repo3(),
            ].map((repo) => {
              const [name, ...desc] = repo.split(' → ')
              return (
                <div key={repo} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400/60 mt-2" />
                  <div className="flex items-start gap-2 flex-1 rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-4 py-3">
                    <span className="font-mono text-sm text-cyan-300 font-semibold flex-shrink-0">
                      {name}
                    </span>
                    <span className="font-mono text-cyan-400/40 flex-shrink-0">→</span>
                    <span className="text-sm text-muted-foreground/70">{desc.join(' → ')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-6">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed">
            {m.talk_lp_ecosystem_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-cyan-500/40 pl-4">
            <p className="text-lg font-semibold text-cyan-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_ecosystem_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
