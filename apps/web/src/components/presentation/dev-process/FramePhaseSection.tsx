import { AnimatedSection, Card, cn } from '@repo/ui'
import { Compass, FileText, Info, Tag } from 'lucide-react'
import { m } from '@/paraglide/messages'

type StepCardData = {
  icon: React.ReactNode
  title: string
  goal: string
  artifact: string
  gate: string
  color: string
  borderColor: string
}

function StepCard({ card }: { card: StepCardData }) {
  return (
    <Card variant="subtle" className={cn('p-4 lg:p-5 h-full', card.borderColor)}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn('rounded-lg p-2', card.color)}>{card.icon}</div>
        <h3 className="font-bold text-sm">{card.title}</h3>
      </div>
      <div className="space-y-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
            {m.talk_dp_goal()}
          </p>
          <p className="text-xs text-muted-foreground">{card.goal}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
            {m.talk_dp_artifact()}
          </p>
          <p className="text-xs font-mono text-foreground/80">{card.artifact}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
            {m.talk_dp_gate()}
          </p>
          <p className="text-xs text-muted-foreground">{card.gate}</p>
        </div>
      </div>
    </Card>
  )
}

function FrameArtifactPreview() {
  const outlineItems = ['Problem', 'Who', 'Constraints', 'Out of Scope', 'Tier']

  return (
    <AnimatedSection>
      <Card variant="subtle" className="p-4 lg:p-5 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-500">
            artifacts/frames/&#123;slug&#125;.mdx
          </span>
        </div>
        <div className="space-y-1.5">
          {outlineItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-md border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1.5"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
              <span className="text-[11px] font-mono text-foreground/70">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedSection>
  )
}

export function FramePhaseSection() {
  const steps: StepCardData[] = [
    {
      icon: <Tag className="h-4 w-4 text-emerald-500" />,
      title: 'Triage',
      goal: m.talk_dp_frame_triage_goal(),
      artifact: m.talk_dp_frame_triage_artifact(),
      gate: m.talk_dp_frame_triage_gate(),
      color: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: <FileText className="h-4 w-4 text-emerald-500" />,
      title: 'Frame',
      goal: m.talk_dp_frame_frame_goal(),
      artifact: m.talk_dp_frame_frame_artifact({ slug: '{slug}' }),
      gate: m.talk_dp_frame_frame_gate(),
      color: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Compass className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_frame_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_frame_subtitle()}</p>
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
        <FrameArtifactPreview />
      </div>

      <AnimatedSection className="mt-6">
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <Info className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground italic">{m.talk_dp_frame_annotation()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
