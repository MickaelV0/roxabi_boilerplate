import { AnimatedSection, Badge, Card } from '@repo/ui'
import { Code, GitPullRequest, Hammer, Info, ListTodo } from 'lucide-react'
import { m } from '@/paraglide/messages'
import { StepCard, type StepCardData } from './StepCard'

function TddBadges() {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-500 bg-red-500/5">
        RED
      </Badge>
      <Badge
        variant="outline"
        className="text-[10px] border-green-500/40 text-green-500 bg-green-500/5"
      >
        GREEN
      </Badge>
      <Badge
        variant="outline"
        className="text-[10px] border-blue-500/40 text-blue-500 bg-blue-500/5"
      >
        REFACTOR
      </Badge>
    </div>
  )
}

function PrCommandPreview() {
  return (
    <div className="mt-1 rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5">
      <p className="font-mono text-[10px] text-foreground/70">
        <span className="text-violet-500">$</span> gh pr create --base staging
      </p>
    </div>
  )
}

type AgentRoute = {
  domain: string
  agent: string
}

function AgentRoutingTable() {
  const routes: AgentRoute[] = [
    { domain: 'Frontend', agent: 'frontend-dev' },
    { domain: 'Backend', agent: 'backend-dev' },
    { domain: 'CI/CD', agent: 'devops' },
    { domain: 'Tests', agent: 'tester' },
    { domain: 'Docs', agent: 'doc-writer' },
  ]

  return (
    <AnimatedSection>
      <Card variant="subtle" className="p-4 lg:p-5 border-violet-500/20 bg-violet-500/5">
        <p className="text-xs font-semibold text-violet-500 mb-3">
          {m.talk_dp_build_agent_routing()}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {routes.map((route) => (
            <div
              key={route.domain}
              className="rounded-md border border-violet-500/10 bg-violet-500/5 px-2.5 py-1.5 text-center"
            >
              <p className="text-[10px] text-muted-foreground/70">{route.domain}</p>
              <p className="text-[11px] font-mono text-foreground/80">{route.agent}</p>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedSection>
  )
}

export function BuildPhaseSection() {
  const steps: StepCardData[] = [
    {
      icon: <ListTodo className="h-4 w-4 text-violet-500" />,
      title: 'Plan',
      goal: m.talk_dp_build_plan_goal(),
      artifact: m.talk_dp_build_plan_artifact({ N: '{N}', slug: '{slug}' }),
      gate: m.talk_dp_build_plan_gate(),
      color: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
    },
    {
      icon: <Code className="h-4 w-4 text-violet-500" />,
      title: 'Implement',
      goal: m.talk_dp_build_implement_goal(),
      color: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
      extra: (
        <div>
          <p className="text-[10px] text-muted-foreground/70 mb-1">
            {m.talk_dp_build_test_first()}
          </p>
          <TddBadges />
        </div>
      ),
    },
    {
      icon: <GitPullRequest className="h-4 w-4 text-violet-500" />,
      title: 'PR',
      goal: m.talk_dp_build_pr_goal(),
      color: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
      extra: <PrCommandPreview />,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-violet-500/10 p-2">
            <Hammer className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_build_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_build_subtitle()}</p>
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

      <div className="mt-6">
        <AgentRoutingTable />
      </div>

      <AnimatedSection className="mt-6">
        <div className="flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <Info className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground italic">{m.talk_dp_build_annotation()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
