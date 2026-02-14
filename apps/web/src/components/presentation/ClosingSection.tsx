import { AnimatedSection, Card, cn } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Lightbulb, Target, XCircle } from 'lucide-react'

const withoutItems = [
  'Manual PRs, copy-paste reviews',
  'Generic AI output, boilerplate code',
  'One feature at a time, sequential work',
] as const

const withItems = [
  'Automated pipeline: /pr, /review, /promote',
  'Specialized agents with domain docs + skills',
  'Parallel worktrees, 3 features simultaneously',
] as const

const takeaways = [
  {
    text: 'Specialization beats generalism',
    detail: 'agent.md + docs + skills = specialist',
  },
  {
    text: 'Process discipline matters',
    detail: 'As much as code generation itself',
  },
  {
    text: 'Never self-review',
    detail: 'Not even an AI author should review its own code',
  },
  {
    text: 'Good process, good code',
    detail: 'From idea to production, end to end',
  },
] as const

export function ClosingSection() {
  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Key Takeaways</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          What we learned building a SaaS framework with an AI team.
        </p>
      </AnimatedSection>

      {/* Main content: 3-column grid */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {/* Column 1: Before / After comparison */}
        <AnimatedSection>
          <Card variant="subtle" className="p-5 h-full">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-red-500 mb-3">Without</p>
                <div className="space-y-2">
                  {withoutItems.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border/30 pt-5">
                <p className="text-sm font-semibold text-green-500 mb-3">With Claude Code</p>
                <div className="space-y-2">
                  {withItems.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </AnimatedSection>

        {/* Column 2-3: Takeaways 2x2 grid */}
        <AnimatedSection className="lg:col-span-2 md:delay-150">
          <div className="grid gap-4 sm:grid-cols-2 h-full">
            {takeaways.map((takeaway, index) => (
              <Card
                key={takeaway.text}
                variant="subtle"
                className={cn('p-5', index === 0 && 'border-primary/30')}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{takeaway.text}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{takeaway.detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </AnimatedSection>
      </div>

      {/* Bottom: tagline + CTA */}
      <AnimatedSection className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <p className="text-lg italic text-muted-foreground">
          Entirely built with Claude Code — zero manual code, zero manual deployments.
        </p>
        <Link
          to="/docs/$"
          params={{ _splat: 'guides/agent-teams' }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
        >
          Explore the Docs
          <ArrowRight className="h-4 w-4" />
        </Link>
      </AnimatedSection>
    </div>
  )
}
