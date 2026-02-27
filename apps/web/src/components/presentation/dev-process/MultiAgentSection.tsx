import { AnimatedSection, Badge, Card } from '@repo/ui'
import { AlertCircle, CheckCircle, Eye, FileText, GitBranch, Layers, Palette } from 'lucide-react'
import { m } from '@/paraglide/messages'

function AbDemo() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Same Spec box */}
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-5 py-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{m.talk_dp_multi_spec_label()}</span>
      </div>

      {/* Arrow down + split */}
      <div className="flex flex-col items-center">
        <div className="h-4 w-px bg-border" />
        <div className="relative flex items-start gap-6 sm:gap-12">
          {/* Left branch line */}
          <div className="absolute left-1/2 top-0 h-px w-1/2 -translate-x-full bg-border" />
          {/* Right branch line */}
          <div className="absolute left-1/2 top-0 h-px w-1/2 bg-border" />
          {/* Left vertical */}
          <div className="flex flex-col items-center">
            <div className="h-4 w-px bg-border" />
            {/* Agent A */}
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/5 px-4 py-2.5">
              <Palette className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-mono font-medium text-blue-500">frontend-design</span>
            </div>
            <div className="h-4 w-px bg-border" />
          </div>
          {/* Right vertical */}
          <div className="flex flex-col items-center">
            <div className="h-4 w-px bg-border" />
            {/* Agent B */}
            <div className="flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/5 px-4 py-2.5">
              <Layers className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-mono font-medium text-purple-500">ui-ux-pro-max</span>
            </div>
            <div className="h-4 w-px bg-border" />
          </div>
        </div>
        {/* Converge line */}
        <div className="h-px w-full max-w-[200px] sm:max-w-[280px] bg-border" />
        <div className="h-4 w-px bg-border" />
      </div>

      {/* Human Picks node */}
      <div className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/5 px-5 py-3">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm font-semibold text-green-500">
          {m.talk_dp_multi_pick_label()} ✓
        </span>
      </div>
    </div>
  )
}

type PatternCardData = {
  id: string
  icon: React.ReactNode
  title: () => string
  desc: () => string
}

export function MultiAgentSection() {
  const patterns: PatternCardData[] = [
    {
      id: 'parallel',
      icon: <GitBranch className="h-4 w-4 text-indigo-500" />,
      title: m.talk_dp_multi_parallel_title,
      desc: m.talk_dp_multi_parallel_desc,
    },
    {
      id: 'reviewer',
      icon: <Eye className="h-4 w-4 text-indigo-500" />,
      title: m.talk_dp_multi_reviewer_title,
      desc: m.talk_dp_multi_reviewer_desc,
    },
    {
      id: 'escalation',
      icon: <AlertCircle className="h-4 w-4 text-indigo-500" />,
      title: m.talk_dp_multi_escalation_title,
      desc: m.talk_dp_multi_escalation_desc,
    },
  ]

  const primitives = ['TaskCreate', 'TaskUpdate', 'SendMessage', 'blockedBy']

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <GitBranch className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_multi_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_multi_subtitle()}</p>
          </div>
        </div>
      </AnimatedSection>

      {/* A/B Demo hero */}
      <AnimatedSection className="mt-8">
        <Card variant="subtle" className="p-8 border-indigo-500/20 bg-indigo-500/5">
          <AbDemo />
        </Card>
      </AnimatedSection>

      {/* Pattern cards */}
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {patterns.map((pattern) => (
          <AnimatedSection key={pattern.id}>
            <Card variant="subtle" className="flex flex-col gap-3 p-5 border-indigo-500/20 h-full">
              <div className="rounded-lg bg-indigo-500/10 p-2 w-fit">{pattern.icon}</div>
              <p className="text-sm font-semibold">{pattern.title()}</p>
              <p className="text-xs text-muted-foreground">{pattern.desc()}</p>
            </Card>
          </AnimatedSection>
        ))}
      </div>

      {/* Coordination primitives */}
      <AnimatedSection className="mt-6">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            {m.talk_dp_multi_primitives_label()}:
          </span>
          {primitives.map((p) => (
            <Badge
              key={p}
              variant="outline"
              className="border-indigo-500/30 bg-indigo-500/5 text-indigo-500 font-mono text-[11px]"
            >
              {p}
            </Badge>
          ))}
        </div>
      </AnimatedSection>
    </div>
  )
}
