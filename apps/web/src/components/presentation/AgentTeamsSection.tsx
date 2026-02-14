import { AnimatedSection, Card, cn } from '@repo/ui'
import { ArrowRight } from 'lucide-react'

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

export function AgentTeamsSection() {
  const [domainCategory, qualityCategory, strategyCategory] = categories

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-[400px] w-[400px] -translate-x-1/4 rounded-full bg-chart-2/5 blur-[100px] dark:bg-chart-2/10" />
      </div>

      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Agent Teams in Action</h2>
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

      {/* Collaboration Patterns */}
      <AnimatedSection className="mt-12">
        <h3 className="text-2xl font-semibold mb-6">Collaboration Patterns</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Test-First */}
          <Card variant="subtle" className="p-6 lg:p-8">
            <h4 className="text-xl font-semibold mb-4">Test-First</h4>
            <div className="space-y-3">
              {tddSteps.map((step, index) => (
                <div key={step.phase}>
                  <div className={cn('rounded-xl border p-4 bg-background/50', step.borderColor)}>
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
          </Card>

          {/* Review Pipeline */}
          <Card variant="subtle" className="p-6 lg:p-8">
            <h4 className="text-xl font-semibold mb-4">Review Pipeline</h4>
            <div className="space-y-3">
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
          </Card>
        </div>
      </AnimatedSection>
    </div>
  )
}
