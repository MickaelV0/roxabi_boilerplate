import { AnimatedSection, Card, cn } from '@repo/ui'
import { Bot, Key, Shield, Wrench } from 'lucide-react'
import { m } from '@/paraglide/messages'

const WORKFLOW_YAML = `- uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    base_branch: \${{ github.base_ref }}
    claude_args: >-
      --max-turns 25
      --allowed-tools Bash,Read,Edit,Write,Glob,Grep
    prompt: |
      Review the diff, auto-fix safe issues,
      post structured comment.`

type Step = {
  n: number
  label: () => string
}

function StepList() {
  const steps: ReadonlyArray<Step> = [
    { n: 1, label: m.talk_dp_cca_step1 },
    { n: 2, label: m.talk_dp_cca_step2 },
    { n: 3, label: m.talk_dp_cca_step3 },
    { n: 4, label: m.talk_dp_cca_step4 },
    { n: 5, label: m.talk_dp_cca_step5 },
  ]

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-start gap-3">
          {/* Circle + connector */}
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
              <span className="text-[10px] font-bold text-primary">{step.n}</span>
            </div>
            {i < steps.length - 1 && <div className="w-px flex-1 bg-border min-h-[28px]" />}
          </div>
          {/* Label */}
          <p className={cn('text-sm text-foreground leading-snug', i < steps.length - 1 && 'pb-7')}>
            {step.label()}
          </p>
        </div>
      ))}
    </div>
  )
}

type Badge = {
  icon: typeof Shield
  label: () => string
  color: string
  iconColor: string
  borderColor: string
}

export function ClaudeCodeActionSection() {
  const badges: ReadonlyArray<Badge> = [
    {
      icon: Bot,
      label: m.talk_dp_cca_badge_no_trigger,
      color: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: Shield,
      label: m.talk_dp_cca_badge_tools,
      color: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/20',
    },
    {
      icon: Key,
      label: m.talk_dp_cca_badge_oauth,
      color: 'bg-green-500/10',
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/20',
    },
  ]

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px] dark:bg-primary/8" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">{m.talk_dp_cca_title()}</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_cca_subtitle()}</p>
      </AnimatedSection>

      {/* Two columns */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Left — How it works */}
        <AnimatedSection>
          <Card variant="subtle" className="h-full p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              {m.talk_dp_cca_how_title()}
            </p>
            <StepList />
          </Card>
        </AnimatedSection>

        {/* Right — Workflow config */}
        <AnimatedSection>
          <Card variant="subtle" className="h-full p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              {m.talk_dp_cca_config_title()}
            </p>
            <pre className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground/90 overflow-x-auto whitespace-pre-wrap">
              {WORKFLOW_YAML}
            </pre>
          </Card>
        </AnimatedSection>
      </div>

      {/* Bottom badges */}
      <AnimatedSection className="mt-8">
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => (
            <div
              key={badge.label()}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                badge.color,
                badge.borderColor
              )}
            >
              <badge.icon className={cn('h-3.5 w-3.5 shrink-0', badge.iconColor)} />
              <span>{badge.label()}</span>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </div>
  )
}
