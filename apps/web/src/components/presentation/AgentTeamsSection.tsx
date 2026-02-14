import { AnimatedSection, Card, cn } from '@repo/ui'

type Agent = {
  name: string
  color: string
  borderColor: string
  scope: string
}

type Category = {
  title: string
  subtitle: string
  agents: Agent[]
}

const categories: [Category, Category, Category] = [
  {
    title: 'Domain Agents',
    subtitle: 'Code writers',
    agents: [
      {
        name: 'frontend-dev',
        color: 'text-chart-1',
        borderColor: 'border-chart-1/50',
        scope: 'apps/web/, packages/ui/',
      },
      {
        name: 'backend-dev',
        color: 'text-chart-2',
        borderColor: 'border-chart-2/50',
        scope: 'apps/api/, packages/types/',
      },
      {
        name: 'devops',
        color: 'text-chart-3',
        borderColor: 'border-chart-3/50',
        scope: 'packages/config/, root configs',
      },
    ],
  },
  {
    title: 'Quality Agents',
    subtitle: 'Verification',
    agents: [
      {
        name: 'tester',
        color: 'text-chart-4',
        borderColor: 'border-chart-4/50',
        scope: 'Test generation & coverage',
      },
      {
        name: 'fixer',
        color: 'text-chart-5',
        borderColor: 'border-chart-5/50',
        scope: 'Fix accepted review comments',
      },
      {
        name: 'security-auditor',
        color: 'text-destructive',
        borderColor: 'border-destructive/50',
        scope: 'Vulnerability detection',
      },
    ],
  },
  {
    title: 'Strategy Agents',
    subtitle: 'Planning',
    agents: [
      {
        name: 'architect',
        color: 'text-primary',
        borderColor: 'border-primary/50',
        scope: 'System design, tier classification',
      },
      {
        name: 'product-lead',
        color: 'text-accent-foreground',
        borderColor: 'border-accent/50',
        scope: 'Requirements, triage, specs',
      },
      {
        name: 'doc-writer',
        color: 'text-muted-foreground',
        borderColor: 'border-muted-foreground/50',
        scope: 'Documentation maintenance',
      },
    ],
  },
]

const primitives = [
  {
    name: 'TaskCreate / TaskUpdate / TaskList',
    description: 'Shared task list between agents',
  },
  {
    name: 'SendMessage',
    description: 'Direct messaging between agents',
  },
  {
    name: 'blockedBy',
    description: 'Task dependencies and sequencing',
  },
  {
    name: 'Fresh reviewer pattern',
    description: 'No agent reviews code it wrote',
  },
] as const

export function AgentTeamsSection() {
  const [domainCategory, qualityCategory, strategyCategory] = categories

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-[400px] w-[400px] -translate-x-1/4 rounded-full bg-chart-2/5 blur-[100px] dark:bg-chart-2/10" />
      </div>

      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Agent Teams</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          9 agents in 3 categories. Coordinate via shared task lists and messaging.
        </p>
      </AnimatedSection>

      {/* Hub-and-spoke layout: center hub with category spokes */}
      <div className="mt-12 grid gap-6 lg:grid-cols-7 lg:items-start">
        {/* Domain Agents — left column */}
        <AnimatedSection className="lg:col-span-2">
          <Card variant="subtle" className="p-6">
            <h3 className="text-xl font-semibold">{domainCategory.title}</h3>
            <p className="text-sm text-muted-foreground">{domainCategory.subtitle}</p>
            <div className="mt-5 space-y-3">
              {domainCategory.agents.map((agent) => (
                <div
                  key={agent.name}
                  className={cn('rounded-lg border-l-4 bg-muted/20 py-3 px-4', agent.borderColor)}
                >
                  <p className={cn('font-mono font-semibold text-sm', agent.color)}>{agent.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{agent.scope}</p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedSection>

        {/* Central hub — coordination primitives */}
        <AnimatedSection className="lg:col-span-3">
          <Card variant="subtle" className="p-6 items-center text-center">
            <div className="rounded-full border-2 border-primary/30 bg-primary/5 px-6 py-3 mb-6">
              <p className="font-mono text-sm font-bold text-primary">team-lead</p>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Orchestrates all agents via shared task lists and direct messaging
            </p>
            <div className="w-full grid gap-2 sm:grid-cols-2">
              {primitives.map((primitive) => (
                <div key={primitive.name} className="rounded-lg bg-muted/20 p-3 text-left">
                  <p className="font-mono text-xs font-semibold text-primary">{primitive.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{primitive.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedSection>

        {/* Right column: Quality + Strategy stacked */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AnimatedSection className="md:delay-150">
            <Card variant="subtle" className="p-6">
              <h3 className="text-xl font-semibold">{qualityCategory.title}</h3>
              <p className="text-sm text-muted-foreground">{qualityCategory.subtitle}</p>
              <div className="mt-5 space-y-3">
                {qualityCategory.agents.map((agent) => (
                  <div
                    key={agent.name}
                    className={cn('rounded-lg border-l-4 bg-muted/20 py-3 px-4', agent.borderColor)}
                  >
                    <p className={cn('font-mono font-semibold text-sm', agent.color)}>
                      {agent.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{agent.scope}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedSection>

          <AnimatedSection className="md:delay-150">
            <Card variant="subtle" className="p-6">
              <h3 className="text-xl font-semibold">{strategyCategory.title}</h3>
              <p className="text-sm text-muted-foreground">{strategyCategory.subtitle}</p>
              <div className="mt-5 space-y-3">
                {strategyCategory.agents.map((agent) => (
                  <div
                    key={agent.name}
                    className={cn('rounded-lg border-l-4 bg-muted/20 py-3 px-4', agent.borderColor)}
                  >
                    <p className={cn('font-mono font-semibold text-sm', agent.color)}>
                      {agent.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{agent.scope}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </div>
  )
}
