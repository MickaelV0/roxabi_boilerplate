import { AnimatedSection, Card, cn } from '@repo/ui'
import { ArrowRight, GitBranch, Rocket, Shield } from 'lucide-react'
import { CodeBlock } from '@/components/presentation/CodeBlock'

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

const deployTargets = [
  { name: 'Web', framework: 'TanStack Start / Nitro', root: 'apps/web' },
  { name: 'API', framework: 'NestJS (zero-config)', root: 'apps/api' },
] as const

const worktreeCode = `# Every feature gets its own worktree
git worktree add ../roxabi-42 \\
  -b feat/42-user-auth staging

cd ../roxabi-42
claude  # start coding in isolation`

export function InfraWorkflowSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Infrastructure & Workflow</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Guardrails that enforce quality at every stage.
        </p>
      </AnimatedSection>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left: Worktree workflow */}
        <AnimatedSection>
          <Card variant="subtle" className="p-6 lg:p-8 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Worktree Isolation</h3>
            </div>

            <p className="text-muted-foreground mb-4">
              Every code change requires a worktree. No direct commits to main or staging.
            </p>

            <CodeBlock>{worktreeCode}</CodeBlock>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Each feature gets its own directory. Agents work in parallel without conflicts.
              </p>
            </div>
          </Card>
        </AnimatedSection>

        {/* Right: CI/CD + Deployment */}
        <AnimatedSection>
          <Card variant="subtle" className="p-6 lg:p-8 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">CI/CD & Deployment</h3>
            </div>

            {/* Git hooks pipeline */}
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Git Hooks Pipeline
            </p>
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

            {/* Deployment targets */}
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3">
              Vercel Deployment
            </p>
            <div className="grid grid-cols-2 gap-3">
              {deployTargets.map((target) => (
                <div
                  key={target.name}
                  className="rounded-lg border border-border/30 bg-background/50 p-3"
                >
                  <p className="font-semibold">{target.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{target.framework}</p>
                  <p className="font-mono text-xs text-primary/70 mt-1">{target.root}</p>
                </div>
              ))}
            </div>

            {/* Promote flow */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <span className="rounded bg-muted/40 px-2 py-1 font-mono text-xs">staging</span>
              <ArrowRight className="h-4 w-4 text-primary/60" />
              <span className="rounded bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                /promote
              </span>
              <ArrowRight className="h-4 w-4 text-primary/60" />
              <span className="rounded bg-muted/40 px-2 py-1 font-mono text-xs">main</span>
              <ArrowRight className="h-4 w-4 text-primary/60" />
              <span className="rounded bg-chart-2/10 px-2 py-1 font-mono text-xs text-chart-2">
                Vercel
              </span>
            </div>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}
