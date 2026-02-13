import { AnimatedSection, cn, useIntersectionVisibility } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

const pipelineSteps = [
  {
    command: '/bootstrap',
    from: 'Idea',
    to: 'Spec',
    description: 'Interview, analyze, write spec',
  },
  {
    command: '/scaffold',
    from: 'Spec',
    to: 'Code',
    description: 'Agents implement in parallel',
  },
  {
    command: '/review',
    from: 'Code',
    to: 'Reviewed',
    description: 'Fresh review + /1b1 walkthrough',
  },
  {
    command: '/pr',
    from: 'Reviewed',
    to: 'PR',
    description: 'Create pull request',
  },
  {
    command: '/promote',
    from: 'Staging',
    to: 'Main',
    description: 'Staging to production',
  },
] as const

export function EndToEndSection() {
  const { ref: pipelineRef, isVisible } = useIntersectionVisibility<HTMLDivElement>({
    threshold: 0.3,
  })

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight text-center lg:text-5xl">
          End-to-End: Idea to Production
        </h2>
        <p className="mt-4 text-lg text-muted-foreground text-center">
          A real feature in 5 commands.
        </p>
      </AnimatedSection>

      {/* Pipeline flow */}
      <div ref={pipelineRef} className="mt-14">
        {/* Desktop: horizontal pipeline */}
        <div className="hidden lg:flex items-center justify-center gap-2">
          {pipelineSteps.map((step, index) => (
            <div
              key={step.command}
              className={cn(
                'flex items-center gap-2 transition-all duration-700',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{
                transitionDelay: isVisible ? `${index * 200}ms` : '0ms',
              }}
            >
              <div className="flex flex-col items-center rounded-2xl border border-border/50 bg-card/50 p-5 text-center min-w-[150px] hover:bg-card/80 transition-colors">
                <p className="font-mono text-lg font-bold text-primary">{step.command}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {step.from} → {step.to}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">{step.description}</p>
              </div>
              {index < pipelineSteps.length - 1 && (
                <ArrowRight
                  className={cn(
                    'h-5 w-5 text-primary/60 shrink-0 transition-all duration-500',
                    isVisible ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    transitionDelay: isVisible ? `${index * 200 + 100}ms` : '0ms',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile/Tablet: vertical pipeline */}
        <div className="lg:hidden space-y-3 max-w-md mx-auto">
          {pipelineSteps.map((step, index) => (
            <div key={step.command}>
              <div
                className={cn(
                  'rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-700',
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
                )}
                style={{
                  transitionDelay: isVisible ? `${index * 150}ms` : '0ms',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-primary">{step.command}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.from} → {step.to}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
              {index < pipelineSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Final stats */}
      <AnimatedSection className="mt-14">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-xl font-semibold lg:text-2xl">
            808 sessions. 680 hours of compute. 624 commits. 88% task completion.
          </p>
          <p className="mt-4 text-muted-foreground">
            19 PR review fixes across 4 parallel agents touching 30 files — in a single session.
          </p>
        </div>
      </AnimatedSection>

      {/* Closing */}
      <AnimatedSection className="mt-12 text-center">
        <p className="text-muted-foreground">
          Built with{' '}
          <Link
            to="/"
            className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Roxabi
          </Link>
        </p>
      </AnimatedSection>
    </div>
  )
}
