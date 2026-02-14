import { AnimatedSection, Card, cn } from '@repo/ui'
import { AlertTriangle, ArrowRight, CheckCircle2, GitBranch, Shield } from 'lucide-react'
import { CodeBlock } from '@/components/presentation/CodeBlock'

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

const hooksPipeline = [
  {
    name: 'pre-commit',
    description: 'Biome lint + auto-fix staged files',
    color: 'border-chart-1/30',
  },
  {
    name: 'commit-msg',
    description: 'Commitlint validates Conventional Commits',
    color: 'border-chart-2/30',
  },
  {
    name: 'pre-push',
    description: 'Full lint, typecheck, test coverage',
    color: 'border-chart-3/30',
  },
] as const

const worktreeCode = `# Issue #42 → branch → worktree — automatic
> /scaffold --issue 42

# Claude reads the issue, creates worktree,
# codes in isolation, opens PR
# One command. No manual git needed.`

export function DevProcessSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Development Process</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Match process to complexity. Isolate every change. Enforce quality automatically.
        </p>
      </AnimatedSection>

      {/* Two-column layout */}
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left column: Tier decision tree + key insight */}
        <AnimatedSection>
          <Card variant="subtle" className="p-6 lg:p-8 h-full">
            {/* Root question */}
            <div className="flex items-center gap-3 text-lg font-semibold">
              <AlertTriangle className="size-5 text-yellow-500 shrink-0" />
              <span>Is it 3 files or fewer with no architecture risk?</span>
            </div>

            <div className="ml-6 mt-6 space-y-4 border-l-2 border-border/50 pl-6">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={cn('rounded-xl border p-4 transition-colors', tier.color)}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={cn('size-3 rounded-full shrink-0', tier.dotColor)} />
                    <span className="font-bold text-lg">{tier.name}</span>
                    <span className="text-muted-foreground">{tier.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{tier.criteria}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-foreground/80">{tier.process}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Key insight */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Key insight:</span> A 50-file
                mechanical change may be F-lite. A 3-file rate limiter may be F-full.
              </p>
            </div>
          </Card>
        </AnimatedSection>

        {/* Right column: Worktree isolation + Quality gates */}
        <div className="flex flex-col gap-6">
          {/* Worktree isolation */}
          <AnimatedSection className="md:delay-150">
            <Card variant="subtle" className="p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <GitBranch className="size-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Worktree Isolation</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Issue = branch = worktree. Claude Code handles the mapping automatically — no manual
                git commands needed.
              </p>

              <CodeBlock>{worktreeCode}</CodeBlock>
            </Card>
          </AnimatedSection>

          {/* Quality gates */}
          <AnimatedSection className="md:delay-150">
            <Card variant="subtle" className="p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Shield className="size-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Quality Gates</h3>
              </div>

              <div className="space-y-2">
                {hooksPipeline.map((hook, index) => (
                  <div key={hook.name}>
                    <div
                      className={cn(
                        'rounded-lg border bg-background/50 p-3 flex items-center gap-3',
                        hook.color
                      )}
                    >
                      <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                        {hook.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{hook.description}</span>
                    </div>
                    {index < hooksPipeline.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowRight className="h-3 w-3 text-muted-foreground/40 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </div>
  )
}
