import { AnimatedSection, Card, cn, useInView, useReducedMotion } from '@repo/ui'
import { ArrowRight, Workflow } from 'lucide-react'
import { m } from '@/paraglide/messages'

type PhaseBlock = {
  name: string
  steps: string
  color: string
  bgColor: string
  borderColor: string
  dotColor: string
}

function usePhases(): ReadonlyArray<PhaseBlock> {
  return [
    {
      name: m.talk_dp_pipeline_frame(),
      steps: m.talk_dp_pipeline_frame_steps(),
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/5',
      borderColor: 'border-emerald-500/40',
      dotColor: 'bg-emerald-500',
    },
    {
      name: m.talk_dp_pipeline_shape(),
      steps: m.talk_dp_pipeline_shape_steps(),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/40',
      dotColor: 'bg-blue-500',
    },
    {
      name: m.talk_dp_pipeline_build(),
      steps: m.talk_dp_pipeline_build_steps(),
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/5',
      borderColor: 'border-violet-500/40',
      dotColor: 'bg-violet-500',
    },
    {
      name: m.talk_dp_pipeline_verify(),
      steps: m.talk_dp_pipeline_verify_steps(),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/40',
      dotColor: 'bg-amber-500',
    },
    {
      name: m.talk_dp_pipeline_ship(),
      steps: m.talk_dp_pipeline_ship_steps(),
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/5',
      borderColor: 'border-rose-500/40',
      dotColor: 'bg-rose-500',
    },
  ]
}

function PipelineDesktop({
  phases,
  visible,
}: {
  phases: ReadonlyArray<PhaseBlock>
  visible: boolean
}) {
  return (
    <div className="hidden lg:flex items-center justify-center gap-3">
      {phases.map((phase, index) => (
        <div
          key={phase.name}
          className={cn(
            'flex items-center gap-3 transition-all duration-700',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
          style={{ transitionDelay: visible ? `${index * 200}ms` : '0ms' }}
        >
          <Card
            variant="subtle"
            className={cn(
              'items-center p-5 text-center min-w-[160px]',
              phase.bgColor,
              phase.borderColor
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', phase.dotColor)} />
              <p className={cn('font-bold text-base', phase.color)}>{phase.name}</p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{phase.steps}</p>
          </Card>
          {index < phases.length - 1 && (
            <ArrowRight
              className={cn(
                'h-4 w-4 text-muted-foreground/50 shrink-0 transition-all duration-500',
                visible ? 'opacity-100' : 'opacity-0'
              )}
              style={{ transitionDelay: visible ? `${index * 200 + 100}ms` : '0ms' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function PipelineMobile({
  phases,
  visible,
}: {
  phases: ReadonlyArray<PhaseBlock>
  visible: boolean
}) {
  return (
    <div className="lg:hidden space-y-3 max-w-md mx-auto">
      {phases.map((phase, index) => (
        <div key={phase.name}>
          <Card
            variant="subtle"
            className={cn(
              'p-4 transition-all duration-700',
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6',
              phase.bgColor,
              phase.borderColor
            )}
            style={{ transitionDelay: visible ? `${index * 150}ms` : '0ms' }}
          >
            <div className="flex items-center gap-3">
              <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', phase.dotColor)} />
              <span className={cn('font-bold text-sm', phase.color)}>{phase.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{phase.steps}</span>
            </div>
          </Card>
          {index < phases.length - 1 && (
            <div className="flex justify-center py-1">
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 rotate-90" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function BigPictureSection() {
  const reducedMotion = useReducedMotion()
  const { ref: pipelineRef, inView } = useInView({ threshold: 0.3, triggerOnce: true })
  const visible = inView || reducedMotion

  const phases = usePhases()

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/4 h-[400px] w-[400px] -translate-x-1/4 rounded-full bg-emerald-500/5 blur-[100px] dark:bg-emerald-500/10" />
        <div className="absolute right-0 bottom-1/4 h-[400px] w-[400px] translate-x-1/4 rounded-full bg-violet-500/5 blur-[100px] dark:bg-violet-500/10" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_pipeline_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_pipeline_subtitle()}</p>
      </AnimatedSection>

      <div ref={pipelineRef} className="mt-14">
        <PipelineDesktop phases={phases} visible={visible} />
        <PipelineMobile phases={phases} visible={visible} />
      </div>

      <AnimatedSection className="mt-8">
        <p className="text-center text-sm text-muted-foreground/70 italic">
          {m.talk_dp_pipeline_conditional()}
        </p>
      </AnimatedSection>
    </div>
  )
}
