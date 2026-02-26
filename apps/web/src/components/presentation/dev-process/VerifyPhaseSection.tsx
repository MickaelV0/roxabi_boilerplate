import { AnimatedSection, Card, cn } from '@repo/ui'
import { CheckSquare, Eye, Info, ShieldCheck, Wrench } from 'lucide-react'
import { m } from '@/paraglide/messages'

type StepCardData = {
  icon: React.ReactNode
  title: string
  goal: string
  color: string
  borderColor: string
  extra: React.ReactNode
}

function StepCard({ card }: { card: StepCardData }) {
  return (
    <Card variant="subtle" className={cn('p-4 lg:p-5 h-full', card.borderColor)}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn('rounded-lg p-2', card.color)}>{card.icon}</div>
        <h3 className="font-bold text-sm">{card.title}</h3>
      </div>
      <div className="space-y-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
            {m.talk_dp_goal()}
          </p>
          <p className="text-xs text-muted-foreground">{card.goal}</p>
        </div>
        {card.extra}
      </div>
    </Card>
  )
}

function ValidateChecklist() {
  const checks = ['lint', 'typecheck', 'test', 'i18n', 'env', 'license']

  return (
    <div className="space-y-1 mt-1">
      {checks.map((check) => (
        <div
          key={check}
          className="flex items-center gap-2 rounded-md border border-amber-500/10 bg-amber-500/5 px-2 py-1"
        >
          <CheckSquare className="h-3 w-3 text-amber-500/60 shrink-0" />
          <span className="text-[11px] font-mono text-foreground/70">{check}</span>
        </div>
      ))}
    </div>
  )
}

function ReviewAgentList() {
  const agents = ['security-auditor', 'architect', 'product-lead', 'tester', 'domain agents']

  return (
    <div>
      <div className="flex flex-wrap gap-1 mt-1">
        {agents.map((agent) => (
          <span
            key={agent}
            className="inline-flex rounded-md border border-amber-500/15 bg-amber-500/5 px-2 py-0.5 text-[10px] font-mono text-foreground/70"
          >
            {agent}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-amber-500 font-semibold italic">
        {m.talk_dp_verify_review_fresh()}
      </p>
    </div>
  )
}

function FixFlow() {
  return (
    <div className="mt-1 rounded-md border border-amber-500/10 bg-amber-500/5 px-2.5 py-1.5">
      <p className="text-[11px] font-mono text-foreground/70">{m.talk_dp_verify_fix_flow()}</p>
    </div>
  )
}

export function VerifyPhaseSection() {
  const steps: StepCardData[] = [
    {
      icon: <CheckSquare className="h-4 w-4 text-amber-500" />,
      title: 'Validate',
      goal: m.talk_dp_verify_validate_goal(),
      color: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      extra: <ValidateChecklist />,
    },
    {
      icon: <Eye className="h-4 w-4 text-amber-500" />,
      title: 'Review',
      goal: m.talk_dp_verify_review_goal(),
      color: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      extra: <ReviewAgentList />,
    },
    {
      icon: <Wrench className="h-4 w-4 text-amber-500" />,
      title: 'Fix',
      goal: m.talk_dp_verify_fix_goal(),
      color: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      extra: <FixFlow />,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_verify_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_verify_subtitle()}</p>
          </div>
        </div>
      </AnimatedSection>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {steps.map((step) => (
          <AnimatedSection key={step.title}>
            <StepCard card={step} />
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection className="mt-6">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground italic">{m.talk_dp_verify_annotation()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
