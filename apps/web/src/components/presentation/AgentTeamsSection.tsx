import { AnimatedSection, Card, cn } from '@repo/ui'
import { AlertTriangle, CheckCircle2, Crown, Eye, Users, XCircle } from 'lucide-react'

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

const reviewSteps: ReadonlyArray<{ step: string; label: string; emphasis?: boolean }> = [
  { step: '1', label: 'Fresh agents review (never the author)', emphasis: true },
  { step: '2', label: 'Conventional Comments per domain' },
  { step: '3', label: 'Human decides each finding via AskUserQuestion' },
  { step: '4', label: 'Parallel fixers apply accepted fixes' },
]

const orchestratorDos = [
  'Spawn specialized agents via Task tool',
  'Assign tasks, track dependencies',
  'Synthesize results, report to human',
] as const

const orchestratorDonts = [
  'Write or edit code directly',
  'Write documentation content',
  'Run tests or linters',
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
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Agent Teams in Action</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          9 agents, 3 categories. The orchestrator delegates — it never writes code.
        </p>
      </AnimatedSection>

      {/* Line 1: Team Lead + 3 categories — horizontal */}
      <AnimatedSection className="mt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Team Lead / Orchestrator */}
          <Card variant="subtle" className="p-4 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-primary" />
              <p className="font-mono text-sm font-bold text-primary">orchestrator</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Spawns agents, assigns tasks, synthesizes. Never writes code — preserves context
              window.
            </p>
            <div className="space-y-1">
              {orchestratorDos.map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
              {orchestratorDonts.map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <CategoryCard title="Strategy" subtitle="Planning & design" agents={strategyAgents} />
          <CategoryCard title="Domain" subtitle="Code writers" agents={domainAgents} />
          <CategoryCard title="Quality" subtitle="Verification" agents={qualityAgents} />
        </div>
      </AnimatedSection>

      {/* Line 2: Review Pipeline + Honest Take */}
      <AnimatedSection className="mt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Review Pipeline */}
          <Card variant="subtle" className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <p className="font-semibold">Review Pipeline</p>
            </div>
            <div className="space-y-1.5">
              {reviewSteps.map((step) => (
                <div
                  key={step.step}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border bg-background/50 px-3 py-2',
                    step.emphasis ? 'border-primary/30' : 'border-border/30'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold',
                      step.emphasis ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                    )}
                  >
                    {step.step}
                  </div>
                  <p className={cn('text-xs font-medium', step.emphasis && 'text-primary')}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
            {/* Fresh review insight */}
            <div className="mt-3 rounded-lg border border-border/30 bg-muted/10 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Why fresh agents?</span> An agent
                that wrote the code has sunk-cost bias — it won&apos;t question its own decisions. A
                fresh reviewer sees the code for the first time and challenges every choice, like a
                real code review.
              </p>
            </div>
          </Card>

          {/* Honest take: what works, what doesn't */}
          <Card variant="subtle" className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="font-semibold">Honest Take</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                <p className="text-xs font-semibold text-green-500 mb-1.5">What works well</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    Subagents via Task tool — Claude manages coordination internally
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    Specialized agents with domain docs + skills
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    Fresh reviewers catch what authors miss
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs font-semibold text-red-500 mb-1.5">What doesn&apos;t</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                    Multi-panel Agent Teams — coordination overhead exceeds benefit
                  </li>
                  <li className="flex items-start gap-1.5">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                    Orchestrator writing code — burns context, produces worse results
                  </li>
                  <li className="flex items-start gap-1.5">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                    Generalist agents — produce generic, boilerplate output
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </AnimatedSection>
    </div>
  )
}
