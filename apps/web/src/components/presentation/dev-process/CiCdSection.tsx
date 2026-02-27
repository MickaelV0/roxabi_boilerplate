import { AnimatedSection, Card, cn } from '@repo/ui'
import { CheckCircle2, GitBranch, GitMerge, Layers, Rocket, ShieldCheck, Zap } from 'lucide-react'
import { m } from '@/paraglide/messages'

const CI_JOBS = [
  { label: 'Secrets', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { label: 'Lint', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { label: 'Typecheck', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { label: 'Tests', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
] as const

type CiStage = {
  id: string
  icon: typeof CheckCircle2
  label: () => string
  sub?: boolean
  showJobs?: boolean
}

function CiPipelineHalf() {
  const stages: ReadonlyArray<CiStage> = [
    { id: 'precommit', icon: CheckCircle2, label: m.talk_dp_cicd_precommit },
    { id: 'prepush', icon: CheckCircle2, label: m.talk_dp_cicd_prepush },
    { id: 'actions', icon: CheckCircle2, label: m.talk_dp_cicd_actions, showJobs: true },
    { id: 'e2e', icon: CheckCircle2, label: m.talk_dp_cicd_e2e },
  ]

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {m.talk_dp_cicd_ci_title()}
      </p>

      {/* Pipeline stages */}
      <div className="relative flex flex-col gap-0">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-start gap-3">
            {/* Connector line + icon */}
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-green-500/15 p-1.5 border border-green-500/30">
                <stage.icon className="h-3.5 w-3.5 text-green-500" />
              </div>
              {i < stages.length - 1 && <div className="w-px flex-1 bg-border min-h-[24px]" />}
            </div>
            {/* Label */}
            <div className={cn('pb-6', i === stages.length - 1 && 'pb-0')}>
              <p className="text-sm text-foreground leading-snug">{stage.label()}</p>
              {/* Job pills for GitHub Actions stage */}
              {stage.showJobs && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CI_JOBS.map((job) => (
                    <span
                      key={job.label}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        job.color
                      )}
                    >
                      {job.label}
                    </span>
                  ))}
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {m.talk_dp_cicd_job_build()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type CdFlowStep = {
  id: string
  icon: typeof GitBranch
  label: () => string
  action: () => string
  color: string
  iconColor: string
  borderColor: string
}

function CdPipelineHalf() {
  const steps: ReadonlyArray<CdFlowStep> = [
    {
      id: 'feat',
      icon: GitBranch,
      label: m.talk_dp_cicd_feat,
      action: m.talk_dp_cicd_preview,
      color: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'staging',
      icon: GitMerge,
      label: m.talk_dp_cicd_staging,
      action: m.talk_dp_cicd_preview,
      color: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/30',
    },
    {
      id: 'main',
      icon: Rocket,
      label: m.talk_dp_cicd_main,
      action: m.talk_dp_cicd_prod,
      color: 'bg-green-500/10',
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/30',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {m.talk_dp_cicd_cd_title()}
      </p>

      <div className="relative flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={cn('rounded-full p-1.5 border', step.color, step.borderColor)}>
                <step.icon className={cn('h-3.5 w-3.5', step.iconColor)} />
              </div>
              {i < steps.length - 1 && <div className="w-px flex-1 bg-border min-h-[36px]" />}
            </div>
            <div className={cn('pb-8', i === steps.length - 1 && 'pb-0')}>
              <p className="text-sm font-semibold text-foreground">{step.label()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">→ {step.action()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CiCdSection() {
  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-green-500/5 blur-[100px] dark:bg-green-500/8" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_cicd_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_cicd_subtitle()}</p>
      </AnimatedSection>

      {/* Two-column layout */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <AnimatedSection>
          <Card variant="subtle" className="h-full p-6 border-green-500/20">
            <CiPipelineHalf />
          </Card>
        </AnimatedSection>

        <AnimatedSection>
          <Card variant="subtle" className="h-full p-6 border-blue-500/20">
            <CdPipelineHalf />
          </Card>
        </AnimatedSection>
      </div>

      {/* Bottom callout */}
      <AnimatedSection className="mt-8">
        <div className="flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              <Zap className="inline h-3.5 w-3.5 mr-1 text-green-500" />
            </span>
            {m.talk_dp_cicd_callout()}
          </p>
        </div>
      </AnimatedSection>
    </div>
  )
}
