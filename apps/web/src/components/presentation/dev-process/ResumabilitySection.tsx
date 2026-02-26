import { AnimatedSection, Card, cn, useInView, useReducedMotion } from '@repo/ui'
import { CheckCircle2, Circle, FileText, Loader2, RefreshCw, Search, Terminal } from 'lucide-react'
import { m } from '@/paraglide/messages'

type ScanLine = {
  label: string
  status: 'done' | 'in_progress' | 'pending'
}

function useScanLines(): ReadonlyArray<ScanLine> {
  return [
    { label: m.talk_dp_resume_triage(), status: 'done' },
    { label: m.talk_dp_resume_frame(), status: 'done' },
    { label: m.talk_dp_resume_spec(), status: 'done' },
    { label: m.talk_dp_resume_plan(), status: 'done' },
    { label: m.talk_dp_resume_implement(), status: 'in_progress' },
    { label: m.talk_dp_resume_pr(), status: 'pending' },
    { label: m.talk_dp_resume_review(), status: 'pending' },
  ]
}

type ArtifactCard = {
  title: string
  question: string
  path: string
  color: string
  bgColor: string
  borderColor: string
  iconColor: string
}

function useArtifactCards(): ReadonlyArray<ArtifactCard> {
  return [
    {
      title: m.talk_dp_resume_frame(),
      question: m.talk_dp_resume_artifact_frame(),
      path: 'artifacts/frames/',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/5',
      borderColor: 'border-emerald-500/40',
      iconColor: 'text-emerald-500',
    },
    {
      title: m.talk_dp_resume_analysis(),
      question: m.talk_dp_resume_artifact_analysis(),
      path: 'artifacts/analyses/',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/40',
      iconColor: 'text-blue-500',
    },
    {
      title: m.talk_dp_resume_spec(),
      question: m.talk_dp_resume_artifact_spec(),
      path: 'artifacts/specs/',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/5',
      borderColor: 'border-violet-500/40',
      iconColor: 'text-violet-500',
    },
    {
      title: m.talk_dp_resume_plan(),
      question: m.talk_dp_resume_artifact_plan(),
      path: 'artifacts/plans/',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/5',
      borderColor: 'border-rose-500/40',
      iconColor: 'text-rose-500',
    },
  ]
}

function StatusIcon({ status }: { status: ScanLine['status'] }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-amber-500 shrink-0 animate-spin" />
    case 'pending':
      return <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
  }
}

function statusLabel(status: ScanLine['status']): string {
  switch (status) {
    case 'done':
      return m.talk_dp_resume_done()
    case 'in_progress':
      return m.talk_dp_resume_in_progress()
    case 'pending':
      return m.talk_dp_resume_pending()
  }
}

function ScanVisual({ lines, visible }: { lines: ReadonlyArray<ScanLine>; visible: boolean }) {
  return (
    <Card variant="subtle" className="p-0 overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 bg-muted/30">
        <Terminal className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm font-semibold text-primary">
          {m.talk_dp_resume_scan_cmd()}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {m.talk_dp_resume_scan_title()}
        </span>
      </div>

      {/* Scan lines */}
      <div className="px-4 py-4 space-y-2.5">
        {lines.map((line, index) => (
          <div
            key={line.label}
            className={cn(
              'flex items-center gap-3 transition-all duration-500',
              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            )}
            style={{ transitionDelay: visible ? `${index * 120}ms` : '0ms' }}
          >
            <StatusIcon status={line.status} />
            <span className="font-mono text-sm">{line.label}</span>
            <span
              className={cn(
                'ml-auto text-xs font-mono',
                line.status === 'done' && 'text-emerald-500',
                line.status === 'in_progress' && 'text-amber-500',
                line.status === 'pending' && 'text-muted-foreground/50'
              )}
            >
              {statusLabel(line.status)}
            </span>
          </div>
        ))}
      </div>

      {/* Restart callout */}
      <div className="border-t border-border/50 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground italic">{m.talk_dp_resume_restart()}</p>
        </div>
      </div>
    </Card>
  )
}

function ArtifactTypeCards({
  cards,
  visible,
}: {
  cards: ReadonlyArray<ArtifactCard>
  visible: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-muted-foreground">
          {m.talk_dp_resume_artifacts_title()}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card, index) => (
          <Card
            key={card.path}
            variant="subtle"
            className={cn(
              'p-4 transition-all duration-600',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
              card.bgColor,
              card.borderColor
            )}
            style={{ transitionDelay: visible ? `${index * 100 + 400}ms` : '0ms' }}
          >
            <div className="flex items-start gap-3">
              <div className={cn('rounded-lg bg-background/50 p-2 shrink-0')}>
                <FileText className={cn('h-4 w-4', card.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-bold', card.color)}>{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.question}</p>
                <p className="text-xs font-mono text-muted-foreground/60 mt-1.5">{card.path}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ResumabilitySection() {
  const reducedMotion = useReducedMotion()
  const { ref: scanRef, inView } = useInView({ threshold: 0.2, triggerOnce: true })
  const visible = inView || reducedMotion

  const scanLines = useScanLines()
  const artifactCards = useArtifactCards()

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-[400px] w-[400px] -translate-x-1/4 rounded-full bg-violet-500/5 blur-[100px] dark:bg-violet-500/10" />
        <div className="absolute right-0 bottom-1/3 h-[350px] w-[350px] translate-x-1/4 rounded-full bg-emerald-500/5 blur-[100px] dark:bg-emerald-500/10" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_resume_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_resume_subtitle()}</p>
      </AnimatedSection>

      <div ref={scanRef} className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-12 items-start">
        <ScanVisual lines={scanLines} visible={visible} />
        <ArtifactTypeCards cards={artifactCards} visible={visible} />
      </div>
    </div>
  )
}
