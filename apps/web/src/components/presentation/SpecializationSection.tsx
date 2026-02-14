import { AnimatedSection, Card, cn } from '@repo/ui'
import { ArrowRight, BookOpen, FileCode2, Sparkles, Wrench } from 'lucide-react'

const ingredients = [
  {
    icon: FileCode2,
    title: 'agent.md',
    subtitle: 'Role definition',
    description:
      'Scoped file boundaries, permitted tools, domain permissions. The agent knows exactly what it owns.',
    detail: 'apps/web, packages/ui',
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
  },
  {
    icon: BookOpen,
    title: 'Docs',
    subtitle: 'Standards & patterns',
    description:
      'Mandatory reads before every task. Frontend patterns, testing standards, code review checklists.',
    detail: 'frontend-patterns.mdx, testing.mdx',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    icon: Wrench,
    title: 'Skills',
    subtitle: 'Slash commands',
    description:
      'Reusable workflows that extend capabilities. Design guidance, library docs, commit automation.',
    detail: 'ui-ux-pro-max, context7',
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
] as const

export function SpecializationSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            The Specialization Formula
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          A generalist agent produces generic UI. A specialist produces production quality.
        </p>
      </AnimatedSection>

      {/* Ingredient cards + result card in a 4-column grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ingredients.map((ingredient, index) => (
          <AnimatedSection
            key={ingredient.title}
            className={cn(index === 1 && 'md:delay-150', index === 2 && 'md:delay-300')}
          >
            <Card variant="subtle" className="p-5 lg:p-6 h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('rounded-lg p-2', ingredient.bgColor)}>
                  <ingredient.icon className={cn('h-4 w-4', ingredient.color)} />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{ingredient.title}</h3>
                  <p className="text-xs text-muted-foreground">{ingredient.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{ingredient.description}</p>
              <div className="mt-3 rounded-md border border-border/30 bg-muted/20 px-3 py-2">
                <p className="font-mono text-xs text-muted-foreground">{ingredient.detail}</p>
              </div>
            </Card>
          </AnimatedSection>
        ))}

        {/* Result card */}
        <AnimatedSection className="md:delay-450">
          <Card variant="subtle" className="p-5 lg:p-6 h-full border-primary/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">Specialist</h3>
                <p className="text-xs text-muted-foreground">The output</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              A focused agent that produces production-quality output instead of generic
              boilerplate.
            </p>
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="font-mono text-xs text-primary/80">FE dev with design sense</p>
            </div>
          </Card>
        </AnimatedSection>
      </div>

      {/* Example callout */}
      <AnimatedSection className="mt-8">
        <Card variant="subtle" className="p-5 lg:p-6 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Example: frontend-dev agent</p>
              <p className="text-sm text-muted-foreground">
                Knows its file boundaries (<span className="font-mono">apps/web</span>,{' '}
                <span className="font-mono">packages/ui</span>), reads{' '}
                <span className="font-mono">frontend-patterns.mdx</span> before every task, and has
                the <span className="font-mono">ui-ux-pro-max</span> skill for design decisions. A
                generalist agent produces generic UI. A specialist produces production quality.
              </p>
            </div>
          </div>
        </Card>
      </AnimatedSection>
    </div>
  )
}
