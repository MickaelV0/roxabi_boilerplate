import { AnimatedSection, Card, cn, useInView, useReducedMotion } from '@repo/ui'
import { ArrowRight, GitPullRequest, Globe, Rocket, Workflow } from 'lucide-react'
import { m } from '@/paraglide/messages'

type PipelineStep = {
  command: string
  from: string
  to: string
  description: string
  isGate?: boolean
}

function getPipelineSteps(): ReadonlyArray<PipelineStep> {
  return [
    {
      command: '/bootstrap',
      from: m.talk_e2e_step_idea(),
      to: m.talk_e2e_step_analysis(),
      description: m.talk_e2e_desc_interview(),
      isGate: true,
    },
    {
      command: '/bootstrap',
      from: m.talk_e2e_step_analysis(),
      to: m.talk_e2e_step_spec(),
      description: m.talk_e2e_desc_promote_spec(),
      isGate: true,
    },
    {
      command: '/scaffold',
      from: m.talk_e2e_step_spec(),
      to: m.talk_e2e_step_code(),
      description: m.talk_e2e_desc_plan_agents(),
    },
    {
      command: '/pr',
      from: m.talk_e2e_step_code(),
      to: m.talk_e2e_step_pr(),
      description: m.talk_e2e_desc_create_pr(),
    },
    {
      command: '/review',
      from: m.talk_e2e_step_pr(),
      to: m.talk_e2e_step_reviewed(),
      description: m.talk_e2e_desc_fresh_review(),
      isGate: true,
    },
    {
      command: 'Merge',
      from: m.talk_e2e_step_reviewed(),
      to: m.talk_e2e_step_staging(),
      description: m.talk_e2e_desc_pr_merged(),
    },
    {
      command: '/promote',
      from: m.talk_e2e_step_staging(),
      to: m.talk_e2e_step_main(),
      description: m.talk_e2e_desc_preview_deploy(),
      isGate: true,
    },
  ]
}

function getIntegrations() {
  return [
    { icon: GitPullRequest, label: 'GitHub', detail: m.talk_e2e_int_github_detail() },
    { icon: Rocket, label: 'Vercel', detail: m.talk_e2e_int_vercel_detail() },
    { icon: Globe, label: 'CI/CD', detail: m.talk_e2e_int_cicd_detail() },
  ]
}

function PipelineDesktop({
  steps,
  visible,
}: {
  steps: ReadonlyArray<PipelineStep>
  visible: boolean
}) {
  return (
    <div className="hidden lg:flex items-center justify-center gap-1.5">
      {steps.map((step, index) => (
        <div
          key={`${step.command}-${step.from}`}
          className={cn(
            'flex items-center gap-1.5 transition-all duration-700',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
          style={{ transitionDelay: visible ? `${index * 180}ms` : '0ms' }}
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
              <p className="mt-1.5 text-xs font-semibold text-yellow-500">
                {m.talk_e2e_validation_gate()}
              </p>
            )}
          </Card>
          {index < steps.length - 1 && (
            <ArrowRight
              className={cn(
                'h-4 w-4 text-primary/60 shrink-0 transition-all duration-500',
                visible ? 'opacity-100' : 'opacity-0'
              )}
              style={{ transitionDelay: visible ? `${index * 180 + 90}ms` : '0ms' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function PipelineMobile({
  steps,
  visible,
}: {
  steps: ReadonlyArray<PipelineStep>
  visible: boolean
}) {
  return (
    <div className="lg:hidden space-y-3 max-w-md mx-auto">
      {steps.map((step, index) => (
        <div key={`${step.command}-${step.from}`}>
          <Card
            variant="subtle"
            className={cn(
              'p-4 transition-all duration-700',
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6',
              step.isGate && 'border-yellow-500/30'
            )}
            style={{ transitionDelay: visible ? `${index * 150}ms` : '0ms' }}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-primary">{step.command}</span>
              <span className="text-xs text-muted-foreground">
                {step.from} → {step.to}
              </span>
              {step.isGate && (
                <span className="text-xs font-semibold text-yellow-500">{m.talk_e2e_gate()}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </Card>
          {index < steps.length - 1 && (
            <div className="flex justify-center py-1">
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 rotate-90" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function EndToEndSection() {
  const reducedMotion = useReducedMotion()
  const { ref: pipelineRef, inView } = useInView({ threshold: 0.3, triggerOnce: true })
  const visible = inView || reducedMotion

  const pipelineSteps = getPipelineSteps()
  const integrations = getIntegrations()

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 bottom-1/4 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">{m.talk_e2e_title()}</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_e2e_subtitle()}</p>
      </AnimatedSection>

      <div ref={pipelineRef} className="mt-14">
        <PipelineDesktop steps={pipelineSteps} visible={visible} />
        <PipelineMobile steps={pipelineSteps} visible={visible} />
      </div>

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
