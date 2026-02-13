import { AnimatedSection, cn } from '@repo/ui'
import { ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react'

const tddSteps = [
  {
    phase: 'RED',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    borderColor: 'border-red-500/30',
    description: 'Tester writes failing tests from spec',
  },
  {
    phase: 'GREEN',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    borderColor: 'border-green-500/30',
    description: 'Domain agents implement to pass tests',
  },
  {
    phase: 'REFACTOR',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500/30',
    description: 'Clean up while keeping tests green',
  },
] as const

const reviewSteps = [
  {
    step: '1',
    title: '/review spawns fresh agents',
    description: 'Never the authors — independent perspective',
  },
  {
    step: '2',
    title: 'Conventional Comments',
    description: 'Each produces structured, actionable feedback',
  },
  {
    step: '3',
    title: '/1b1 human walkthrough',
    description: 'Accept, reject, or defer each finding',
  },
  {
    step: '4',
    title: 'Parallel fixers',
    description: 'Apply accepted fixes by domain',
  },
] as const

export function TestReviewSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Test-First & Review Pipeline
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Quality is not optional. It is built into the process.
        </p>
      </AnimatedSection>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left: RED-GREEN-REFACTOR */}
        <AnimatedSection>
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 lg:p-8 h-full">
            <h3 className="text-2xl font-semibold mb-6">Test-First</h3>

            <div className="space-y-4">
              {tddSteps.map((step, index) => (
                <div key={step.phase}>
                  <div
                    className={cn(
                      'rounded-xl border p-4 transition-colors',
                      step.borderColor,
                      'bg-background/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0',
                          step.color
                        )}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className={cn('font-bold', step.textColor)}>{step.phase}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                  {index < tddSteps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Right: Review Pipeline */}
        <AnimatedSection>
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 lg:p-8 h-full">
            <h3 className="text-2xl font-semibold mb-6">Review Pipeline</h3>

            <div className="space-y-4">
              {reviewSteps.map((step, index) => (
                <div key={step.step}>
                  <div className="flex items-start gap-4 rounded-xl border border-border/30 bg-background/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {step.step}
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < reviewSteps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Callout */}
      <AnimatedSection className="mt-10">
        <div className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary shrink-0" />
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
          </div>
          <blockquote className="text-lg font-medium italic text-foreground/90">
            "Human decides, Claude orchestrates, agents specialize."
          </blockquote>
        </div>
      </AnimatedSection>
    </div>
  )
}
