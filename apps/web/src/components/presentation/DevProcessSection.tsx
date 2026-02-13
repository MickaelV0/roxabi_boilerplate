import { AnimatedSection, Card, cn, StatCounter } from '@repo/ui'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'

const tiers = [
  {
    name: 'Tier S',
    label: 'Quick Fix',
    criteria: '3 files or fewer, no architecture risk',
    process: 'Worktree + PR',
    color: 'border-green-500/50 bg-green-500/5',
    dotColor: 'bg-green-500',
  },
  {
    name: 'Tier F-lite',
    label: 'Feature (lite)',
    criteria: 'Clear scope, single domain',
    process: 'Worktree + agents + /review',
    color: 'border-blue-500/50 bg-blue-500/5',
    dotColor: 'bg-blue-500',
  },
  {
    name: 'Tier F-full',
    label: 'Feature (full)',
    criteria: 'New architecture, unclear requirements, >2 domains',
    process: 'Bootstrap + worktree + agents + /review',
    color: 'border-purple-500/50 bg-purple-500/5',
    dotColor: 'bg-purple-500',
  },
] as const

const stats = [
  { value: 624, label: 'Commits', suffix: '' },
  { value: 12110, label: 'Bash Calls', suffix: '' },
  { value: 3647, label: 'Edit Calls', suffix: '' },
  { value: 6572, label: 'Messages', suffix: '' },
  { value: 991, label: 'Human Decisions', suffix: '' },
] as const

export function DevProcessSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Development Process by Tiers
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Match process to complexity. File count alone does not determine tier.
        </p>
      </AnimatedSection>

      {/* Decision flowchart */}
      <AnimatedSection className="mt-12">
        <Card variant="subtle" className="p-6 lg:p-8">
          {/* Root question */}
          <div className="flex items-center gap-3 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            <span>Is it 3 files or fewer with no architecture risk?</span>
          </div>

          <div className="ml-6 mt-6 space-y-4 border-l-2 border-border/50 pl-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn('rounded-xl border p-4 lg:p-5 transition-colors', tier.color)}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className={cn('h-3 w-3 rounded-full shrink-0', tier.dotColor)} />
                  <span className="font-bold text-lg">{tier.name}</span>
                  <span className="text-muted-foreground">{tier.label}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.criteria}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-foreground/80">{tier.process}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </AnimatedSection>

      {/* Key insight */}
      <AnimatedSection className="mt-8">
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Key insight:</span> A 50-file mechanical
            change may be F-lite. A 3-file rate limiter may be F-full.
          </p>
        </div>
      </AnimatedSection>

      {/* Stats row */}
      <AnimatedSection className="mt-12">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-5 lg:gap-8">
          {stats.map((stat) => (
            <Card variant="subtle" key={stat.label} className="p-6 text-center">
              <StatCounter
                value={stat.value}
                label={stat.label}
                suffix={stat.suffix}
                className="[&>p:first-child]:text-3xl [&>p:first-child]:lg:text-4xl"
              />
            </Card>
          ))}
        </div>
      </AnimatedSection>
    </div>
  )
}
