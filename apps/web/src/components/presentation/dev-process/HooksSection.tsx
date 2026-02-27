import { AnimatedSection, Card, cn } from '@repo/ui'
import { CheckCircle2, Cog, GitBranch, Sparkles } from 'lucide-react'
import type { ComponentType } from 'react'
import { m } from '@/paraglide/messages'

type HookEntry = {
  title: () => string
  description: () => string
}

type HookGroup = {
  icon: ComponentType<{ className?: string }>
  title: () => string
  description: () => string
  color: string
  iconBg: string
  borderColor: string
  hooks: ReadonlyArray<HookEntry>
}

function useHookGroups(): ReadonlyArray<HookGroup> {
  return [
    {
      icon: GitBranch,
      title: m.talk_dp_hooks_git_title,
      description: m.talk_dp_hooks_git_desc,
      color: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      hooks: [
        { title: m.talk_dp_hooks_pre_commit_title, description: m.talk_dp_hooks_pre_commit_desc },
        { title: m.talk_dp_hooks_commit_msg_title, description: m.talk_dp_hooks_commit_msg_desc },
        { title: m.talk_dp_hooks_pre_push_title, description: m.talk_dp_hooks_pre_push_desc },
      ],
    },
    {
      icon: Sparkles,
      title: m.talk_dp_hooks_claude_title,
      description: m.talk_dp_hooks_claude_desc,
      color: 'text-cyan-500',
      iconBg: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      hooks: [
        { title: m.talk_dp_hooks_post_tool_title, description: m.talk_dp_hooks_post_tool_desc },
        { title: m.talk_dp_hooks_pre_tool_title, description: m.talk_dp_hooks_pre_tool_desc },
      ],
    },
  ]
}

export function HooksSection() {
  const groups = useHookGroups()

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/4 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-orange-500/5 blur-[100px] dark:bg-orange-500/10" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Cog className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_hooks_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_hooks_subtitle()}</p>
      </AnimatedSection>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <AnimatedSection key={group.title()}>
            <Card variant="subtle" className={cn('h-full p-6', group.borderColor)}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('rounded-xl p-3', group.iconBg)}>
                  <group.icon className={cn('h-5 w-5', group.color)} />
                </div>
                <div>
                  <p className={cn('font-bold text-base', group.color)}>{group.title()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{group.description()}</p>
                </div>
              </div>

              <div className="space-y-3">
                {group.hooks.map((hook) => (
                  <div
                    key={hook.title()}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
                  >
                    <code className={cn('text-xs font-bold mt-0.5 shrink-0', group.color)}>
                      {hook.title()}
                    </code>
                    <p className="text-xs text-muted-foreground">{hook.description()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection className="mt-8">
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{m.talk_dp_hooks_insight()}</span>{' '}
            {m.talk_dp_hooks_insight_text()}
          </p>
        </div>
      </AnimatedSection>
    </div>
  )
}
