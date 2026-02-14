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

const tiers = [
  {
    name: 'Tier S',
    label: 'Quick Fix',
    criteria: '3 files or fewer, no architecture risk',
    process: 'Worktree + PR',
    color: 'border-green-500/50 bg-green-500/5',
    dotColor: 'bg-green-500',
  },
  {
    name: 'Tier F-lite',
    label: 'Feature (lite)',
    criteria: 'Clear scope, single domain',
    process: 'Worktree + agents + /review',
    color: 'border-blue-500/50 bg-blue-500/5',
    dotColor: 'bg-blue-500',
  },
  {
    name: 'Tier F-full',
    label: 'Feature (full)',
    criteria: 'New architecture, unclear requirements, >2 domains',
    process: 'Bootstrap + worktree + agents + /review',
    color: 'border-purple-500/50 bg-purple-500/5',
    dotColor: 'bg-purple-500',
  },
] as const

const gitHooks = [
  {
    name: 'pre-commit',
    description: 'Biome lint + auto-fix staged files',
  },
  {
    name: 'commit-msg',
    description: 'Commitlint validates Conventional Commits',
  },
  {
    name: 'pre-push',
    description: 'Full lint, typecheck, test coverage',
  },
] as const

const claudeHooks = [
  {
    name: 'PostToolUse',
    description: 'Biome auto-format on every file edit',
  },
  {
    name: 'PreToolUse',
    description: 'Security warnings before file changes',
  },
] as const

const tmuxPanes = [
  { issue: '#42', label: 'Auth module', command: '/scaffold --issue 42' },
  { issue: '#43', label: 'API endpoint', command: '/scaffold --issue 43' },
  { issue: '#44', label: 'Dashboard', command: '/scaffold --issue 44' },
] as const

export function DevProcessSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Development Process</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          A 50-file mechanical change may be F-lite. A 3-file rate limiter may be F-full.
        </p>
      </AnimatedSection>

      {/* Three-column layout */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {/* Column 1: Tier decision tree */}
        <AnimatedSection>
          <Card variant="subtle" className="p-5 lg:p-6 h-full">
            <div className="flex items-center gap-2 text-sm font-semibold mb-4">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              <span>Match process to complexity</span>
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

            {/* Key insight */}
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Key insight:</span> A 50-file
                mechanical change may be F-lite. A 3-file rate limiter may be F-full.
              </p>
            </div>
          </Card>
        </AnimatedSection>

        {/* Column 2: Worktree parallelism */}
        <AnimatedSection className="md:delay-150">
          <Card variant="subtle" className="p-5 lg:p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <GitBranch className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Worktree = Parallelism</h3>
                <p className="text-xs text-muted-foreground">3 features simultaneously</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Each issue gets its own worktree — isolated branch, deps, and DB. One Claude Code
              session per pane.
            </p>

            {/* 3 mini terminal panes */}
            <div className="space-y-1.5">
              {tmuxPanes.map((pane) => (
                <div
                  key={pane.issue}
                  className="rounded-md border border-border/40 bg-muted/20 p-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500/50" />
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/50" />
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {pane.issue} — {pane.label}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-primary">&gt; {pane.command}</p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedSection>

        {/* Column 3: Quality gates */}
        <AnimatedSection className="md:delay-300">
          <Card variant="subtle" className="p-5 lg:p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold">Quality Gates</h3>
            </div>

            {/* Git hooks (Lefthook) */}
            <div className="mb-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <GitBranch className="h-3 w-3 text-green-500" />
                <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">
                  Git Hooks (Lefthook)
                </span>
              </div>
              <div className="space-y-1">
                {gitHooks.map((hook) => (
                  <div
                    key={hook.name}
                    className="rounded-md border border-green-500/20 bg-green-500/5 p-2 flex items-center gap-2"
                  >
                    <span className="shrink-0 rounded bg-green-500/10 px-1.5 py-0.5 font-mono text-[10px] text-green-500">
                      {hook.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{hook.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Claude hooks */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Monitor className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  Claude Hooks
                </span>
              </div>
              <div className="space-y-1">
                {claudeHooks.map((hook) => (
                  <div
                    key={hook.name}
                    className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2 flex items-center gap-2"
                  >
                    <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-500">
                      {hook.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{hook.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div className="mt-3 rounded-md border border-border/30 bg-muted/10 p-2">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Rule:</span> Lefthook for hard
                gates. Claude hooks for DX. Claude can&apos;t bypass git hooks.
              </p>
            </div>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}
