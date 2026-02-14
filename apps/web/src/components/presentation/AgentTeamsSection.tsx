import { AnimatedSection, Card, cn } from '@repo/ui'

type Agent = {
  name: string
  color: string
}

const strategyAgents: Agent[] = [
  { name: 'architect', color: 'text-primary bg-primary/10' },
  { name: 'product-lead', color: 'text-accent-foreground bg-accent/20' },
  { name: 'doc-writer', color: 'text-muted-foreground bg-muted/40' },
]

const domainAgents: Agent[] = [
  { name: 'frontend-dev', color: 'text-chart-1 bg-chart-1/10' },
  { name: 'backend-dev', color: 'text-chart-2 bg-chart-2/10' },
  { name: 'devops', color: 'text-chart-3 bg-chart-3/10' },
]

const qualityAgents: Agent[] = [
  { name: 'tester', color: 'text-chart-4 bg-chart-4/10' },
  { name: 'fixer', color: 'text-chart-5 bg-chart-5/10' },
  { name: 'security-auditor', color: 'text-destructive bg-destructive/10' },
]

const tddSteps = [
  {
    phase: 'RED',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    label: 'Tester writes failing tests',
  },
  {
    phase: 'GREEN',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    label: 'Domain agents implement',
  },
  {
    phase: 'REFACTOR',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    label: 'Clean up, tests stay green',
  },
] as const

const reviewSteps = [
  { step: '1', label: 'Fresh agents review' },
  { step: '2', label: 'Conventional Comments' },
  { step: '3', label: 'Human decides each finding' },
  { step: '4', label: 'Parallel fixers apply' },
] as const

function AgentBadge({ agent }: { agent: Agent }) {
  return (
    <span className={cn('rounded-md px-2 py-1 font-mono text-xs font-medium', agent.color)}>
      {agent.name}
    </span>
  )
}

function CategoryCard({
  title,
  subtitle,
  agents,
}: {
  title: string
  subtitle: string
  agents: Agent[]
}) {
  return (
    <Card variant="subtle" className="p-4">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      <div className="flex flex-wrap gap-1.5">
        {agents.map((agent) => (
          <AgentBadge key={agent.name} agent={agent} />
        ))}
      </div>
    </Card>
  )
}

export function AgentTeamsSection() {
  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-[400px] w-[400px] -translate-x-1/4 rounded-full bg-chart-2/5 blur-[100px] dark:bg-chart-2/10" />
      </div>

      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Agent Teams in Action</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          9 agents, 3 categories. One team lead orchestrates via tasks and messaging.
        </p>
      </AnimatedSection>

      {/* Line 1: Team Lead + 3 categories — horizontal */}
      <AnimatedSection className="mt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Team Lead */}
          <Card variant="subtle" className="p-4 text-center">
            <div className="rounded-full border-2 border-primary/30 bg-primary/5 px-4 py-2 inline-block mb-2">
              <p className="font-mono text-sm font-bold text-primary">team-lead</p>
            </div>
            <p className="text-xs text-muted-foreground">Orchestrates, delegates, synthesizes</p>
          </Card>

          <CategoryCard title="Strategy" subtitle="Planning & design" agents={strategyAgents} />
          <CategoryCard title="Domain" subtitle="Code writers" agents={domainAgents} />
          <CategoryCard title="Quality" subtitle="Verification" agents={qualityAgents} />
        </div>
      </AnimatedSection>

      {/* Line 2: Collaboration Patterns */}
      <AnimatedSection className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Collaboration Patterns</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Test-First — vertical */}
          <Card variant="subtle" className="p-5">
            <p className="font-semibold mb-3">Test-First</p>
            <div className="space-y-1.5">
              {tddSteps.map((step, index) => (
                <div key={step.phase}>
                  <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 px-3 py-2">
                    <div
                      className={cn(
                        'h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0',
                        step.color
                      )}
                    >
                      {index + 1}
                    </div>
                    <p className={cn('font-bold text-xs', step.textColor)}>{step.phase}</p>
                    <p className="text-xs text-muted-foreground">{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Review Pipeline — vertical */}
          <Card variant="subtle" className="p-5">
            <p className="font-semibold mb-3">Review Pipeline</p>
            <div className="space-y-1.5">
              {reviewSteps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 px-3 py-2"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {step.step}
                  </div>
                  <p className="text-xs font-medium">{step.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </AnimatedSection>
    </div>
  )
}
