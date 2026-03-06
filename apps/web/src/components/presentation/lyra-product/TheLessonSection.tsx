import { AnimatedSection } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function TheLessonSection() {
  const principles = [
    m.talk_lp_lesson_p1(),
    m.talk_lp_lesson_p2(),
    m.talk_lp_lesson_p3(),
    m.talk_lp_lesson_p4(),
  ]

  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-amber-500/6 blur-[120px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-amber-300">
            {m.talk_lp_lesson_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <blockquote className="max-w-xl border-l-4 border-amber-500/50 pl-6 py-2 mb-6">
            <p className="text-xl font-semibold text-amber-200/90 italic leading-relaxed">
              &ldquo;{m.talk_lp_lesson_epigraph()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <p className="max-w-xl text-base text-muted-foreground/70 leading-relaxed mb-8">
            {m.talk_lp_lesson_body()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="grid grid-cols-1 gap-3 max-w-xl sm:grid-cols-2">
            {principles.map((p) => (
              <div
                key={p}
                className="rounded-lg border border-amber-400/30 bg-amber-500/5 px-4 py-3"
              >
                <p className="font-mono text-sm text-amber-300 font-semibold">{p}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
