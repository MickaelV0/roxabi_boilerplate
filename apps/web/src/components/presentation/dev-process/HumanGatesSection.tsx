import { AnimatedSection, Card, cn, useInView, useReducedMotion } from '@repo/ui'
import { ArrowRight, Lock, MessageSquare, ShieldCheck, Users } from 'lucide-react'
import { m } from '@/paraglide/messages'

type GatedPhase = {
  name: string
  color: string
  bgColor: string
  borderColor: string
  dotColor: string
}

type Gate = {
  label: string
}

function useGatedPhases(): ReadonlyArray<GatedPhase> {
  return [
    {
      name: m.talk_dp_pipeline_frame(),
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/5',
      borderColor: 'border-emerald-500/40',
      dotColor: 'bg-emerald-500',
    },
    {
      name: m.talk_dp_pipeline_shape(),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/40',
      dotColor: 'bg-blue-500',
    },
    {
      name: m.talk_dp_pipeline_build(),
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/5',
      borderColor: 'border-violet-500/40',
      dotColor: 'bg-violet-500',
    },
    {
      name: m.talk_dp_pipeline_verify(),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/40',
      dotColor: 'bg-amber-500',
    },
    {
      name: m.talk_dp_pipeline_ship(),
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/5',
      borderColor: 'border-rose-500/40',
      dotColor: 'bg-rose-500',
    },
  ]
}

function useGates(): ReadonlyArray<Gate> {
  return [
    { label: m.talk_dp_gates_approve_frame() },
    { label: m.talk_dp_gates_approve_spec() },
    { label: m.talk_dp_gates_approve_plan() },
    { label: m.talk_dp_gates_accept_findings() },
    { label: m.talk_dp_gates_approve_merge() },
  ]
}

function GatePipelineDesktop({
  phases,
  gates,
  visible,
}: {
  phases: ReadonlyArray<GatedPhase>
  gates: ReadonlyArray<Gate>
  visible: boolean
}) {
  return (
    <div className="hidden lg:flex items-center justify-center gap-1">
      {phases.map((phase, index) => (
        <div
          key={phase.name}
          className={cn(
            'flex items-center gap-1 transition-all duration-700',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
          style={{ transitionDelay: visible ? `${index * 180}ms` : '0ms' }}
        >
          <Card
            variant="subtle"
            className={cn(
              'items-center p-4 text-center min-w-[110px]',
              phase.bgColor,
              phase.borderColor
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <div className={cn('h-2 w-2 rounded-full shrink-0', phase.dotColor)} />
              <p className={cn('font-bold text-sm', phase.color)}>{phase.name}</p>
            </div>
          </Card>

          {index < phases.length - 1 && gates[index] != null && (
            <div
              className={cn(
                'flex items-center gap-1 transition-all duration-500',
                visible ? 'opacity-100' : 'opacity-0'
              )}
              style={{ transitionDelay: visible ? `${index * 180 + 90}ms` : '0ms' }}
            >
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <div className="flex flex-col items-center gap-1 px-1">
                <ShieldCheck className="h-4 w-4 text-yellow-500" />
                <span className="text-[10px] font-semibold text-yellow-500 whitespace-nowrap leading-tight">
                  {gates[index].label}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function GatePipelineMobile({
  phases,
  gates,
  visible,
}: {
  phases: ReadonlyArray<GatedPhase>
  gates: ReadonlyArray<Gate>
  visible: boolean
}) {
  return (
    <div className="lg:hidden space-y-2 max-w-md mx-auto">
      {phases.map((phase, index) => (
        <div key={phase.name}>
          <Card
            variant="subtle"
            className={cn(
              'p-3.5 transition-all duration-700',
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6',
              phase.bgColor,
              phase.borderColor
            )}
            style={{ transitionDelay: visible ? `${index * 130}ms` : '0ms' }}
          >
            <div className="flex items-center gap-3">
              <div className={cn('h-2 w-2 rounded-full shrink-0', phase.dotColor)} />
              <span className={cn('font-bold text-sm', phase.color)}>{phase.name}</span>
            </div>
          </Card>

          {index < phases.length - 1 && gates[index] != null && (
            <div className="flex items-center justify-center gap-2 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-xs font-semibold text-yellow-500">{gates[index].label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

type BottomCard = {
  icon: typeof MessageSquare
  title: string
  description: string
  iconBg: string
  iconColor: string
}

function useBottomCards(): ReadonlyArray<BottomCard> {
  return [
    {
      icon: MessageSquare,
      title: m.talk_dp_gates_ask_title(),
      description: m.talk_dp_gates_ask_desc(),
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      icon: Users,
      title: m.talk_dp_gates_roles_title(),
      description: m.talk_dp_gates_roles_desc(),
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      icon: Lock,
      title: m.talk_dp_gates_loop_title(),
      description: m.talk_dp_gates_loop_desc(),
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
  ]
}

export function HumanGatesSection() {
  const reducedMotion = useReducedMotion()
  const { ref: pipelineRef, inView } = useInView({ threshold: 0.2, triggerOnce: true })
  const visible = inView || reducedMotion

  const phases = useGatedPhases()
  const gates = useGates()
  const bottomCards = useBottomCards()

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] translate-x-1/4 rounded-full bg-yellow-500/5 blur-[100px] dark:bg-yellow-500/8" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_gates_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_gates_subtitle()}</p>
      </AnimatedSection>

      <div ref={pipelineRef} className="mt-14">
        <GatePipelineDesktop phases={phases} gates={gates} visible={visible} />
        <GatePipelineMobile phases={phases} gates={gates} visible={visible} />
      </div>

      <AnimatedSection className="mt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {bottomCards.map((card) => (
            <Card key={card.title} variant="subtle" className="p-5 flex flex-row items-start gap-4">
              <div className={cn('rounded-xl p-3 shrink-0', card.iconBg)}>
                <card.icon className={cn('h-5 w-5', card.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </AnimatedSection>
    </div>
  )
}
