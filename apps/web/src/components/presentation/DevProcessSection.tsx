import { AnimatedSection, Card, cn } from '@repo/ui'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Monitor,
  Route,
  Shield,
} from 'lucide-react'
import { m } from '@/paraglide/messages'

type TierData = {
  name: string
  label: string
  criteria: string
  process: string
  color: string
  dotColor: string
}

function useTiersData(): TierData[] {
  return [
    {
      name: m.talk_dev_tier_s(),
      label: m.talk_dev_tier_s_label(),
      criteria: m.talk_dev_tier_s_criteria(),
      process: m.talk_dev_tier_s_process(),
      color: 'border-green-500/50 bg-green-500/5',
      dotColor: 'bg-green-500',
    },
    {
      name: m.talk_dev_tier_flite(),
      label: m.talk_dev_tier_flite_label(),
      criteria: m.talk_dev_tier_flite_criteria(),
      process: m.talk_dev_tier_flite_process(),
      color: 'border-blue-500/50 bg-blue-500/5',
      dotColor: 'bg-blue-500',
    },
    {
      name: m.talk_dev_tier_ffull(),
      label: m.talk_dev_tier_ffull_label(),
      criteria: m.talk_dev_tier_ffull_criteria(),
      process: m.talk_dev_tier_ffull_process(),
      color: 'border-purple-500/50 bg-purple-500/5',
      dotColor: 'bg-purple-500',
    },
  ]
}

function TierDecisionColumn({ tiers }: { tiers: TierData[] }) {
  return (
    <AnimatedSection>
      <Card variant="subtle" className="p-5 lg:p-6 h-full">
        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
          <span>{m.talk_dev_match_complexity()}</span>
        </div>
        <div className="space-y-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn('rounded-lg border p-3 transition-colors', tier.color)}
            >
              <div className="flex items-center gap-2">
                <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', tier.dotColor)} />
                <span className="font-bold text-sm">{tier.name}</span>
                <span className="text-xs text-muted-foreground">{tier.label}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{tier.criteria}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-mono text-foreground/80">{tier.process}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{m.talk_dev_key_insight()}</span>{' '}
            {m.talk_dev_key_insight_text()}
          </p>
        </div>
      </Card>
    </AnimatedSection>
  )
}

function WorktreeColumn() {
  const tmuxPanes = [
    { issue: '#42', label: m.talk_dev_pane_auth(), command: '/scaffold --issue 42' },
    { issue: '#43', label: m.talk_dev_pane_api(), command: '/scaffold --issue 43' },
    { issue: '#44', label: m.talk_dev_pane_dashboard(), command: '/scaffold --issue 44' },
  ]

  return (
    <AnimatedSection className="md:delay-150">
      <Card variant="subtle" className="p-5 lg:p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{m.talk_dev_worktree_title()}</h3>
            <p className="text-xs text-muted-foreground">{m.talk_dev_worktree_subtitle()}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{m.talk_dev_worktree_desc()}</p>
        <div className="space-y-1.5">
          {tmuxPanes.map((pane) => (
            <div key={pane.issue} className="rounded-md border border-border/40 bg-muted/20 p-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500/50" />
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/50" />
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {pane.issue} -- {pane.label}
                </span>
              </div>
              <p className="font-mono text-[11px] text-primary">&gt; {pane.command}</p>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedSection>
  )
}

type HookItem = { name: string; description: string }

function HookList({ hooks, color }: { hooks: HookItem[]; color: 'green' | 'blue' }) {
  const borderCls =
    color === 'green' ? 'border-green-500/20 bg-green-500/5' : 'border-blue-500/20 bg-blue-500/5'
  const badgeCls =
    color === 'green' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'

  return (
    <div className="space-y-1">
      {hooks.map((hook) => (
        <div
          key={hook.name}
          className={cn('rounded-md border p-2 flex items-center gap-2', borderCls)}
        >
          <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]', badgeCls)}>
            {hook.name}
          </span>
          <span className="text-[11px] text-muted-foreground">{hook.description}</span>
        </div>
      ))}
    </div>
  )
}

function QualityGatesColumn() {
  const gitHooks: HookItem[] = [
    { name: 'pre-commit', description: m.talk_dev_hook_precommit() },
    { name: 'commit-msg', description: m.talk_dev_hook_commitmsg() },
    { name: 'pre-push', description: m.talk_dev_hook_prepush() },
  ]

  const claudeHooks: HookItem[] = [
    { name: 'PostToolUse', description: m.talk_dev_hook_posttooluse() },
    { name: 'PreToolUse', description: m.talk_dev_hook_pretooluse() },
  ]

  return (
    <AnimatedSection className="md:delay-300">
      <Card variant="subtle" className="p-5 lg:p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-semibold">{m.talk_dev_quality_title()}</h3>
        </div>
        <div className="mb-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <GitBranch className="h-3 w-3 text-green-500" />
            <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">
              {m.talk_dev_git_hooks_label()}
            </span>
          </div>
          <HookList hooks={gitHooks} color="green" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Monitor className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
              {m.talk_dev_claude_hooks_label()}
            </span>
          </div>
          <HookList hooks={claudeHooks} color="blue" />
        </div>
        <div className="mt-3 rounded-md border border-border/30 bg-muted/10 p-2">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{m.talk_dev_quality_rule()}</span>{' '}
            {m.talk_dev_quality_rule_text()}
          </p>
        </div>
      </Card>
    </AnimatedSection>
  )
}

export function DevProcessSection() {
  const tiers = useTiersData()

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">{m.talk_dev_title()}</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dev_subtitle()}</p>
      </AnimatedSection>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <TierDecisionColumn tiers={tiers} />
        <WorktreeColumn />
        <QualityGatesColumn />
      </div>
    </div>
  )
}
