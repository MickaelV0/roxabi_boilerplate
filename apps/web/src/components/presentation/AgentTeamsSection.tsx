import { cn } from '@repo/ui'
import { AnimatedSection } from '@/components/AnimatedSection'

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

const categories: Category[] = [
  {
    title: 'Domain Agents',
    subtitle: 'Code writers',
    agents: [
      {
        name: 'frontend-dev',
        color: 'text-cyan-400',
        borderColor: 'border-cyan-500/50',
        scope: 'apps/web/, packages/ui/',
      },
      {
        name: 'backend-dev',
        color: 'text-green-400',
        borderColor: 'border-green-500/50',
        scope: 'apps/api/, packages/types/',
      },
      {
        name: 'infra-ops',
        color: 'text-yellow-400',
        borderColor: 'border-yellow-500/50',
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
        color: 'text-blue-400',
        borderColor: 'border-blue-500/50',
        scope: 'Test generation & coverage',
      },
      {
        name: 'fixer',
        color: 'text-fuchsia-400',
        borderColor: 'border-fuchsia-500/50',
        scope: 'Fix accepted review comments',
      },
      {
        name: 'security-auditor',
        color: 'text-red-400',
        borderColor: 'border-red-500/50',
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
        color: 'text-slate-300 dark:text-white',
        borderColor: 'border-slate-400/50',
        scope: 'System design, tier classification',
      },
      {
        name: 'product-lead',
        color: 'text-purple-400',
        borderColor: 'border-purple-500/50',
        scope: 'Requirements, triage, specs',
      },
      {
        name: 'doc-writer',
        color: 'text-gray-400',
        borderColor: 'border-gray-500/50',
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
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Agent Teams</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          9 agents in 3 categories. Coordinate via shared task lists and messaging.
        </p>
      </AnimatedSection>

      {/* Category cards */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {categories.map((category) => (
          <AnimatedSection key={category.title}>
            <div className="h-full rounded-2xl border border-border/50 bg-card/50 p-6">
              <h3 className="text-xl font-semibold">{category.title}</h3>
              <p className="text-sm text-muted-foreground">{category.subtitle}</p>

              <div className="mt-5 space-y-3">
                {category.agents.map((agent) => (
                  <div
                    key={agent.name}
                    className={cn(
                      'rounded-lg border-l-4 bg-muted/20 py-3 px-4 transition-colors hover:bg-muted/40',
                      agent.borderColor
                    )}
                  >
                    <p className={cn('font-mono font-semibold text-sm', agent.color)}>
                      {agent.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{agent.scope}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Coordination primitives */}
      <AnimatedSection className="mt-10">
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Coordination Primitives</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {primitives.map((primitive) => (
              <div key={primitive.name} className="rounded-lg bg-muted/20 p-3">
                <p className="font-mono text-sm font-semibold text-primary">{primitive.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{primitive.description}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
}
