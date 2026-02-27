import { AnimatedSection, Card, cn } from '@repo/ui'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { m } from '@/paraglide/messages'

type TierData = {
  name: string
  label: string
  criteria: string
  steps: string
  color: string
  dotColor: string
}

function useTiersData(): ReadonlyArray<TierData> {
  return [
    {
      name: m.talk_dp_tier_s(),
      label: m.talk_dp_tier_s_label(),
      criteria: m.talk_dp_tier_s_criteria(),
      steps: m.talk_dp_tier_s_steps(),
      color: 'border-green-500/50 bg-green-500/5',
      dotColor: 'bg-green-500',
    },
    {
      name: m.talk_dp_tier_flite(),
      label: m.talk_dp_tier_flite_label(),
      criteria: m.talk_dp_tier_flite_criteria(),
      steps: m.talk_dp_tier_flite_steps(),
      color: 'border-blue-500/50 bg-blue-500/5',
      dotColor: 'bg-blue-500',
    },
    {
      name: m.talk_dp_tier_ffull(),
      label: m.talk_dp_tier_ffull_label(),
      criteria: m.talk_dp_tier_ffull_criteria(),
      steps: m.talk_dp_tier_ffull_steps(),
      color: 'border-purple-500/50 bg-purple-500/5',
      dotColor: 'bg-purple-500',
    },
  ]
}

// All 12 steps across all tiers
const ALL_STEPS = [
  'triage',
  'frame',
  'analyze',
  'spec',
  'plan',
  'implement',
  'pr',
  'validate',
  'review',
  'fix',
  'promote',
  'cleanup',
] as const

type StepStatus = 'run' | 'skip' | 'cond'
type TierKey = 'S' | 'F-lite' | 'F-full'
type StepMatrix = Record<(typeof ALL_STEPS)[number], StepStatus>

// Which steps each tier runs, skips, or runs conditionally
const TIER_MATRIX: Record<TierKey, StepMatrix> = {
  S: {
    triage: 'run',
    frame: 'skip',
    analyze: 'skip',
    spec: 'skip',
    plan: 'skip',
    implement: 'run',
    pr: 'run',
    validate: 'run',
    review: 'run',
    fix: 'cond',
    promote: 'cond',
    cleanup: 'cond',
  },
  'F-lite': {
    triage: 'skip',
    frame: 'run',
    analyze: 'skip',
    spec: 'run',
    plan: 'run',
    implement: 'run',
    pr: 'run',
    validate: 'run',
    review: 'run',
    fix: 'cond',
    promote: 'cond',
    cleanup: 'cond',
  },
  'F-full': {
    triage: 'skip',
    frame: 'run',
    analyze: 'run',
    spec: 'run',
    plan: 'run',
    implement: 'run',
    pr: 'run',
    validate: 'run',
    review: 'run',
    fix: 'cond',
    promote: 'cond',
    cleanup: 'cond',
  },
}

function StatusCell({ status }: { status: StepStatus }) {
  if (status === 'run') {
    return (
      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500/15">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      </span>
    )
  }
  if (status === 'skip') {
    return (
      <span className="text-[10px] text-muted-foreground/50 font-mono">
        {m.talk_dp_tier_skip()}
      </span>
    )
  }
  return <span className="text-[10px] text-amber-500 font-mono">{m.talk_dp_tier_cond()}</span>
}

function TierCards({ tiers }: { tiers: ReadonlyArray<TierData> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiers.map((tier) => (
        <AnimatedSection key={tier.name}>
          <Card variant="subtle" className={cn('p-4 lg:p-5 h-full', tier.color)}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', tier.dotColor)} />
              <span className="font-bold text-sm">{tier.name}</span>
              <span className="text-xs text-muted-foreground">{tier.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{tier.criteria}</p>
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-mono text-foreground/80">{tier.steps}</span>
            </div>
          </Card>
        </AnimatedSection>
      ))}
    </div>
  )
}

function SkipMatrix() {
  const tierKeys = ['S', 'F-lite', 'F-full'] as const
  const tierColors = {
    S: 'text-green-500',
    'F-lite': 'text-blue-500',
    'F-full': 'text-purple-500',
  } as const

  return (
    <AnimatedSection>
      <Card variant="subtle" className="p-4 lg:p-5 overflow-x-auto">
        <p className="text-sm font-semibold mb-3">{m.talk_dp_tier_skip_matrix()}</p>
        <table className="w-full text-center text-[11px]">
          <thead>
            <tr>
              <th className="text-left font-semibold text-muted-foreground p-1.5 min-w-[60px]" />
              {ALL_STEPS.map((step) => (
                <th
                  key={step}
                  className="font-mono font-normal text-muted-foreground p-1.5 min-w-[50px]"
                >
                  {step}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tierKeys.map((tierKey) => (
              <tr key={tierKey} className="border-t border-border/30">
                <td className={cn('text-left font-bold p-1.5', tierColors[tierKey])}>{tierKey}</td>
                {ALL_STEPS.map((step) => (
                  <td key={step} className="p-1.5">
                    <div className="flex items-center justify-center">
                      <StatusCell status={TIER_MATRIX[tierKey][step]} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AnimatedSection>
  )
}

function InsightCallout() {
  return (
    <AnimatedSection>
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{m.talk_dp_tier_insight()}</span>{' '}
          {m.talk_dp_tier_insight_text()}
        </p>
      </div>
    </AnimatedSection>
  )
}

export function TierSystemSection() {
  const tiers = useTiersData()

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_tier_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_tier_subtitle()}</p>
      </AnimatedSection>

      <div className="mt-10 space-y-6">
        <TierCards tiers={tiers} />
        <SkipMatrix />
        <InsightCallout />
      </div>
    </div>
  )
}
