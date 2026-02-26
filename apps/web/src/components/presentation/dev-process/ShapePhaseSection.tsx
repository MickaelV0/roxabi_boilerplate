import { AnimatedSection, Card } from '@repo/ui'
import { CheckSquare, ClipboardCheck, Info, Lightbulb, Search } from 'lucide-react'
import { m } from '@/paraglide/messages'
import { StepCard, type StepCardData } from './StepCard'

function SpecStructurePreview() {
  const outlineItems = [
    { label: 'Goal', indent: false },
    { label: 'Users', indent: false },
    { label: 'Expected Behavior', indent: false },
    { label: 'Breadboard', indent: false },
    { label: 'Slices', indent: false },
    { label: 'Success Criteria', indent: false, hasCheckboxes: true },
  ]

  return (
    <AnimatedSection>
      <Card variant="subtle" className="p-4 lg:p-5 border-blue-500/20 bg-blue-500/5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-blue-500">
            artifacts/specs/&#123;N&#125;-&#123;slug&#125;.mdx
          </span>
        </div>
        <div className="space-y-1.5">
          {outlineItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-md border border-blue-500/10 bg-blue-500/5 px-2.5 py-1.5"
            >
              {item.hasCheckboxes ? (
                <CheckSquare className="h-3 w-3 text-blue-500/50 shrink-0" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
              )}
              <span className="text-[11px] font-mono text-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedSection>
  )
}

export function ShapePhaseSection() {
  const steps: StepCardData[] = [
    {
      icon: <Search className="h-4 w-4 text-blue-500" />,
      title: 'Analyze',
      badge: m.talk_dp_shape_ffull_only(),
      goal: m.talk_dp_shape_analyze_goal(),
      artifact: m.talk_dp_shape_analyze_artifact({ N: '{N}', slug: '{slug}' }),
      gate: m.talk_dp_shape_analyze_gate(),
      color: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: <ClipboardCheck className="h-4 w-4 text-blue-500" />,
      title: 'Spec',
      goal: m.talk_dp_shape_spec_goal(),
      artifact: m.talk_dp_shape_spec_artifact({ N: '{N}', slug: '{slug}' }),
      gate: m.talk_dp_shape_spec_gate(),
      color: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_shape_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_shape_subtitle()}</p>
          </div>
        </div>
      </AnimatedSection>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {steps.map((step) => (
          <AnimatedSection key={step.title}>
            <StepCard card={step} />
          </AnimatedSection>
        ))}
      </div>

      <div className="mt-6">
        <SpecStructurePreview />
      </div>

      <AnimatedSection className="mt-6">
        <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground italic">{m.talk_dp_shape_annotation()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
