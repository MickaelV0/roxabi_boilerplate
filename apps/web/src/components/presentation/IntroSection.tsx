import { AnimatedSection, Badge, StatCounter } from '@repo/ui'

export function IntroSection() {
  return (
    <div className="relative mx-auto max-w-6xl text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/15" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/3 rounded-full bg-chart-1/5 blur-[100px] dark:bg-chart-1/10" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <Badge variant="secondary" className="mb-6 text-sm">
            Introducing Claude Code
          </Badge>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight lg:text-6xl">
            Your AI Development Team
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground lg:text-2xl">
            AI agents that write, test, review, and deploy production code. Not autocomplete —
            autonomous development.
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-16">
          <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
            <StatCounter value={1782} label="Sessions" />
            <div className="hidden h-16 w-px bg-border sm:block" />
            <StatCounter value={288} label="Commits" />
            <div className="hidden h-16 w-px bg-border sm:block" />
            <StatCounter value={88} label="Completion Rate" suffix="%" />
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
