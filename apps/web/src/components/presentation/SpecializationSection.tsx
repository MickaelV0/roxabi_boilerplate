import { AnimatedSection, Card, cn } from '@repo/ui'
import { ArrowRight, BookOpen, FileCode2, Sparkles, Wrench } from 'lucide-react'
import { m } from '@/paraglide/messages'

export function SpecializationSection() {
  const ingredients = [
    {
      icon: FileCode2,
      title: 'agent.md',
      subtitle: m.talk_spec_agent_subtitle(),
      description: m.talk_spec_agent_desc(),
      detail: 'apps/web, packages/ui',
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      icon: BookOpen,
      title: m.talk_spec_docs_title(),
      subtitle: m.talk_spec_docs_subtitle(),
      description: m.talk_spec_docs_desc(),
      detail: 'frontend-patterns.mdx, testing.mdx',
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      icon: Wrench,
      title: m.talk_spec_skills_title(),
      subtitle: m.talk_spec_skills_subtitle(),
      description: m.talk_spec_skills_desc(),
      detail: 'ui-ux-pro-max, context7',
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">{m.talk_spec_title()}</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_spec_subtitle()}</p>
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
                <h3 className="text-base font-semibold text-primary">
                  {m.talk_spec_result_title()}
                </h3>
                <p className="text-xs text-muted-foreground">{m.talk_spec_result_subtitle()}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{m.talk_spec_result_desc()}</p>
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="font-mono text-xs text-primary/80">{m.talk_spec_result_detail()}</p>
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
              <p className="text-sm font-semibold mb-1">{m.talk_spec_example_title()}</p>
              <p className="text-sm text-muted-foreground">{m.talk_spec_example_desc()}</p>
            </div>
          </div>
        </Card>
      </AnimatedSection>
    </div>
  )
}
