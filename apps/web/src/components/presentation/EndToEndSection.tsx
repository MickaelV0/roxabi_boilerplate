import { AnimatedSection, Card, cn, useInView, useReducedMotion } from '@repo/ui'
import { ArrowRight, GitPullRequest, Globe, Rocket, Workflow } from 'lucide-react'

type PipelineStep = {
  command: string
  from: string
  to: string
  description: string
  isGate?: boolean
}

const pipelineSteps: ReadonlyArray<PipelineStep> = [
  {
    command: '/bootstrap',
    from: 'Idea',
    to: 'Analysis',
    description: 'Interview, structured analysis',
    isGate: true,
  },
  {
    command: '/bootstrap',
    from: 'Analysis',
    to: 'Spec',
    description: 'Analysis promoted to spec',
    isGate: true,
  },
  {
    command: '/scaffold',
    from: 'Spec',
    to: 'Code',
    description: 'Plan approval, then agents implement',
  },
  {
    command: '/pr',
    from: 'Code',
    to: 'PR',
    description: 'Create pull request',
  },
  {
    command: '/review',
    from: 'PR',
    to: 'Reviewed',
    description: 'Fresh review + /1b1 decisions',
    isGate: true,
  },
  {
    command: 'Merge',
    from: 'Reviewed',
    to: 'Staging',
    description: 'PR merged into staging branch',
  },
  {
    command: '/promote',
    from: 'Staging',
    to: 'Main',
    description: 'Preview verification, then deploy',
    isGate: true,
  },
]

const integrations = [
  {
    icon: GitPullRequest,
    label: 'GitHub',
    detail: 'Issues, Projects, PRs, Actions',
  },
  {
    icon: Rocket,
    label: 'Vercel',
    detail: 'Deploy, logs, env vars, rollback',
  },
  {
    icon: Globe,
    label: 'CI/CD',
    detail: 'GitHub Actions + Vercel auto-deploy',
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
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Idea to Production</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Analysis, spec, code, review, deploy. Claude manages the full SDLC — including GitHub and
          Vercel.
        </p>
      </AnimatedSection>

      {/* Pipeline flow */}
      <div ref={pipelineRef} className="mt-14">
        {/* Desktop: horizontal pipeline */}
        <div className="hidden lg:flex items-center justify-center gap-1.5">
          {pipelineSteps.map((step, index) => (
            <div
              key={`${step.command}-${step.from}`}
              className={cn(
                'flex items-center gap-1.5 transition-all duration-700',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{
                transitionDelay: visible ? `${index * 180}ms` : '0ms',
              }}
            >
              <Card
                variant="subtle"
                className={cn(
                  'items-center p-5 text-center min-w-[140px]',
                  step.isGate && 'border-yellow-500/30'
                )}
              >
                <p className="font-mono text-base font-bold text-primary">{step.command}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {step.from} → {step.to}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">{step.description}</p>
                {step.isGate && (
                  <p className="mt-1.5 text-xs font-semibold text-yellow-500">validation gate</p>
                )}
              </Card>
              {index < pipelineSteps.length - 1 && (
                <ArrowRight
                  className={cn(
                    'h-4 w-4 text-primary/60 shrink-0 transition-all duration-500',
                    visible ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    transitionDelay: visible ? `${index * 180 + 90}ms` : '0ms',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile/Tablet: vertical pipeline */}
        <div className="lg:hidden space-y-3 max-w-md mx-auto">
          {pipelineSteps.map((step, index) => (
            <div key={`${step.command}-${step.from}`}>
              <Card
                variant="subtle"
                className={cn(
                  'p-4 transition-all duration-700',
                  visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6',
                  step.isGate && 'border-yellow-500/30'
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
                  {step.isGate && (
                    <span className="text-xs font-semibold text-yellow-500">gate</span>
                  )}
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

      {/* Integrations row */}
      <AnimatedSection className="mt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {integrations.map((item) => (
            <Card
              key={item.label}
              variant="subtle"
              className="p-4 flex flex-row items-center gap-4"
            >
              <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </Card>
          ))}
        </div>
      </AnimatedSection>
    </div>
  )
}
