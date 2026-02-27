import { AnimatedSection, Card } from '@repo/ui'
import { BookOpen, Check, GitBranch, Plug, Puzzle } from 'lucide-react'
import { m } from '@/paraglide/messages'

const SKILL_ITEMS = ['/ slash command'] as const

const PLUGIN_ITEMS = ['agents', 'skills', 'hooks', 'MCP servers', 'settings', 'memory'] as const

type PluginTypeCardData = {
  icon: React.ReactNode
  title: string
  desc: string
  extra?: React.ReactNode
  accentClass: string
}

export function PluginEcosystemSection() {
  const pluginTypes: PluginTypeCardData[] = [
    {
      icon: <GitBranch className="h-4 w-4 text-emerald-500" />,
      title: m.talk_dp_plugins_workflow_title(),
      desc: m.talk_dp_plugins_workflow_desc(),
      accentClass: 'border-emerald-500/20 bg-emerald-500/5',
    },
    {
      icon: <Plug className="h-4 w-4 text-emerald-500" />,
      title: m.talk_dp_plugins_integration_title(),
      desc: m.talk_dp_plugins_integration_desc(),
      accentClass: 'border-emerald-500/20 bg-emerald-500/5',
    },
    {
      icon: <BookOpen className="h-4 w-4 text-emerald-500" />,
      title: m.talk_dp_plugins_knowledge_title(),
      desc: m.talk_dp_plugins_knowledge_desc(),
      accentClass: 'border-emerald-500/20 bg-emerald-500/5',
      extra: (
        <div className="mt-3 space-y-1.5 rounded-md border border-border/30 bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500/70" />
            <p className="text-[11px] text-muted-foreground">
              {m.talk_dp_plugins_knowledge_before()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500/70" />
            <p className="text-[11px] text-green-500">{m.talk_dp_plugins_knowledge_after()}</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Puzzle className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_plugins_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_plugins_subtitle()}</p>
          </div>
        </div>
      </AnimatedSection>

      {/* Anatomy comparison */}
      <AnimatedSection className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Skill card — minimal */}
          <Card variant="subtle" className="p-5 border-border/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {m.talk_dp_plugins_skill_label()}
            </p>
            <ul className="space-y-2">
              {SKILL_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex h-1 w-1 rounded-full bg-muted-foreground/40" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* Plugin card — richer */}
          <Card variant="subtle" className="p-5 border-emerald-500/30 bg-emerald-500/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-3">
              {m.talk_dp_plugins_plugin_label()}
            </p>
            <ul className="space-y-2">
              {PLUGIN_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </AnimatedSection>

      {/* Plugin type cards */}
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {pluginTypes.map((pt) => (
          <AnimatedSection key={pt.title}>
            <Card variant="subtle" className={`flex flex-col gap-3 p-5 h-full ${pt.accentClass}`}>
              <div className="rounded-lg bg-emerald-500/10 p-2 w-fit">{pt.icon}</div>
              <p className="text-sm font-semibold">{pt.title}</p>
              <p className="text-xs text-muted-foreground">{pt.desc}</p>
              {pt.extra}
            </Card>
          </AnimatedSection>
        ))}
      </div>

      {/* Bottom callout */}
      <AnimatedSection className="mt-6">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-sm font-medium text-emerald-500">{m.talk_dp_plugins_callout()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
