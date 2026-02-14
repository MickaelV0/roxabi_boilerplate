import { AnimatedSection, Card, cn, useInView, useReducedMotion } from '@repo/ui'
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
  const reducedMotion = useReducedMotion()
  const { ref: pipelineRef, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  })
  const visible = inView || reducedMotion

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 bottom-1/4 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight text-center lg:text-5xl">
          Idea to Production
        </h2>
        <p className="mt-4 text-lg text-muted-foreground text-center">
          One feature, five commands, zero context switching.
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
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{
                transitionDelay: visible ? `${index * 200}ms` : '0ms',
              }}
            >
              <Card variant="subtle" className="items-center p-6 text-center min-w-[160px]">
                <p className="font-mono text-lg font-bold text-primary">{step.command}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {step.from} → {step.to}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">{step.description}</p>
              </Card>
              {index < pipelineSteps.length - 1 && (
                <ArrowRight
                  className={cn(
                    'h-5 w-5 text-primary/60 shrink-0 transition-all duration-500',
                    visible ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    transitionDelay: visible ? `${index * 200 + 100}ms` : '0ms',
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
              <Card
                variant="subtle"
                className={cn(
                  'p-4 transition-all duration-700',
                  visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
                )}
                style={{
                  transitionDelay: visible ? `${index * 150}ms` : '0ms',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-primary">{step.command}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.from} → {step.to}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </Card>
              {index < pipelineSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Closing callout */}
      <AnimatedSection className="mt-14">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-xl font-semibold lg:text-2xl">5 commands. From idea to production.</p>
          <p className="mt-4 text-muted-foreground">
            19 PR review fixes across 4 parallel agents touching 30 files — in a single session.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mt-12 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Roxabi
          <ArrowRight className="h-5 w-5" />
        </Link>
      </AnimatedSection>
    </div>
  )
}
