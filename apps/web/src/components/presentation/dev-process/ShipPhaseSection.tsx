import { AnimatedSection, Card, cn } from '@repo/ui'
import { ArrowUpCircle, Info, Rocket, Trash2 } from 'lucide-react'
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

function PromoteDetails() {
  const items = ['version bump', 'changelog', 'release PR', 'GitHub Release']

  return (
    <div>
      <div className="flex flex-wrap gap-1 mt-1">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex rounded-md border border-rose-500/15 bg-rose-500/5 px-2 py-0.5 text-[10px] font-mono text-foreground/70"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-rose-500 font-semibold italic">
        {m.talk_dp_ship_promote_note()}
      </p>
    </div>
  )
}

function CleanupDetails() {
  const commands = ['git worktree remove', 'branch deletion']

  return (
    <div className="space-y-1 mt-1">
      {commands.map((cmd) => (
        <div key={cmd} className="rounded-md border border-rose-500/10 bg-rose-500/5 px-2.5 py-1.5">
          <p className="text-[11px] font-mono text-foreground/70">
            <span className="text-rose-500">$</span> {cmd}
          </p>
        </div>
      ))}
    </div>
  )
}

export function ShipPhaseSection() {
  const steps: StepCardData[] = [
    {
      icon: <ArrowUpCircle className="h-4 w-4 text-rose-500" />,
      title: 'Promote',
      goal: m.talk_dp_ship_promote_goal(),
      color: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      extra: <PromoteDetails />,
    },
    {
      icon: <Trash2 className="h-4 w-4 text-rose-500" />,
      title: 'Cleanup',
      goal: m.talk_dp_ship_cleanup_goal(),
      color: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      extra: <CleanupDetails />,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-rose-500/10 p-2">
            <Rocket className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_ship_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_ship_subtitle()}</p>
          </div>
        </div>
      </AnimatedSection>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {steps.map((step) => (
          <AnimatedSection key={step.title}>
            <StepCard card={step} />
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection className="mt-6">
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
          <Info className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground italic">{m.talk_dp_ship_annotation()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
