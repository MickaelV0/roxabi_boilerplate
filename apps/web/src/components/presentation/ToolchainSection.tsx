import { AnimatedSection, Badge, Card, cn } from '@repo/ui'
import { ArrowRight, Wrench } from 'lucide-react'
import { m } from '@/paraglide/messages'

type Phase = {
  name: string
  description: string
  skills: string[]
  colorClass: string
  borderClass: string
  bgClass: string
}

function usePhases(): Phase[] {
  return [
    {
      name: m.talk_toolchain_phase_plan(),
      description: m.talk_toolchain_plan_desc(),
      skills: ['/interview', '/bootstrap', '/issue-triage', '/adr'],
      colorClass: 'text-chart-1',
      borderClass: 'border-t-chart-1',
      bgClass: 'bg-chart-1/10',
    },
    {
      name: m.talk_toolchain_phase_build(),
      description: m.talk_toolchain_build_desc(),
      skills: ['/scaffold', '/test'],
      colorClass: 'text-chart-2',
      borderClass: 'border-t-chart-2',
      bgClass: 'bg-chart-2/10',
    },
    {
      name: m.talk_toolchain_phase_review(),
      description: m.talk_toolchain_review_desc(),
      skills: ['/review', '/1b1'],
      colorClass: 'text-chart-3',
      borderClass: 'border-t-chart-3',
      bgClass: 'bg-chart-3/10',
    },
    {
      name: m.talk_toolchain_phase_ship(),
      description: m.talk_toolchain_ship_desc(),
      skills: ['/pr', '/promote', '/cleanup'],
      colorClass: 'text-chart-4',
      borderClass: 'border-t-chart-4',
      bgClass: 'bg-chart-4/10',
    },
    {
      name: m.talk_toolchain_phase_maintain(),
      description: m.talk_toolchain_maintain_desc(),
      skills: ['/validate', '/retro', '/issues', '/agent-browser', '/compress'],
      colorClass: 'text-chart-5',
      borderClass: 'border-t-chart-5',
      bgClass: 'bg-chart-5/10',
    },
  ]
}

type PhaseCardProps = {
  phase: Phase
  index: number
}

function PhaseCard({ phase, index }: PhaseCardProps) {
  return (
    <AnimatedSection className={cn(index > 0 && `md:delay-${index * 150}`)}>
      <Card variant="subtle" className={cn('h-full border-t-2 p-5', phase.borderClass)}>
        <div className="mb-3 flex items-center gap-2">
          <div className={cn('rounded-md px-2 py-1', phase.bgClass)}>
            <span className={cn('text-sm font-bold', phase.colorClass)}>{phase.name}</span>
          </div>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{phase.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {phase.skills.map((skill) => (
            <Badge key={skill} variant="outline" className="font-mono text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </Card>
    </AnimatedSection>
  )
}

export function ToolchainSection() {
  const phases = usePhases()

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_toolchain_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_toolchain_subtitle()}</p>
      </AnimatedSection>

      {/* Desktop: horizontal pipeline with arrows */}
      <div className="mt-12 hidden lg:flex lg:items-start lg:gap-2">
        {phases.map((phase, index) => (
          <div key={phase.name} className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <PhaseCard phase={phase} index={index} />
            </div>
            {index < phases.length - 1 && (
              <div className="flex shrink-0 items-center self-center pt-4">
                <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: stacked vertically */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:hidden">
        {phases.map((phase, index) => (
          <PhaseCard key={phase.name} phase={phase} index={index} />
        ))}
      </div>
    </div>
  )
}
