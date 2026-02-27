import { AnimatedSection, Card, cn } from '@repo/ui'
import { Activity, Bot, Globe, ShieldCheck } from 'lucide-react'
import { m } from '@/paraglide/messages'

const QUALITY_ITEMS = [
  m.talk_dp_next_quality_item1,
  m.talk_dp_next_quality_item2,
  m.talk_dp_next_quality_item3,
  m.talk_dp_next_quality_item4,
] as const

type RoadmapItem = {
  id: string
  icon: typeof Activity
  label: () => string
  desc: () => string
  color: string
  iconColor: string
  borderColor: string
}

const ROADMAP_ITEMS: ReadonlyArray<RoadmapItem> = [
  {
    id: 'observability',
    icon: Activity,
    label: m.talk_dp_next_observability_label,
    desc: m.talk_dp_next_observability_desc,
    color: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    borderColor: 'border-violet-500/25',
  },
  {
    id: 'public-api',
    icon: Globe,
    label: m.talk_dp_next_public_api_label,
    desc: m.talk_dp_next_public_api_desc,
    color: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/25',
  },
]

export function WhatsNextSection() {
  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[450px] w-[450px] rounded-full bg-orange-500/5 blur-[110px] dark:bg-orange-500/8" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-orange-500/10 p-2">
            <Activity className="h-5 w-5 text-orange-500" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_next_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_next_subtitle()}</p>
      </AnimatedSection>

      {/* Three-column grid */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* PI Agent card — highlighted */}
        <AnimatedSection>
          <Card variant="subtle" className="h-full p-6 border-primary/30 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <p className="text-base font-semibold">{m.talk_dp_next_pi_title()}</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {m.talk_dp_next_pi_desc()}
            </p>

            {/* External link badges */}
            <div className="flex flex-wrap gap-2">
              <a
                href="https://github.com/badlogic/pi-mono"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  'border-primary/25 bg-primary/10 text-primary hover:bg-primary/20'
                )}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {m.talk_dp_next_pi_github()}
              </a>
              <a
                href="https://www.youtube.com/watch?v=f8cfH5XX-XU"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  'border-red-500/25 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                )}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                  <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                </svg>
                {m.talk_dp_next_pi_youtube()}
              </a>
            </div>
          </Card>
        </AnimatedSection>

        {/* Roadmap card */}
        <AnimatedSection>
          <Card variant="subtle" className="h-full p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Activity className="h-5 w-5 text-violet-500" />
              </div>
              <p className="text-base font-semibold">{m.talk_dp_next_roadmap_title()}</p>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {ROADMAP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-lg border p-3 flex items-start gap-3',
                    item.color,
                    item.borderColor
                  )}
                >
                  <div className="rounded-md bg-background/50 p-1.5 shrink-0">
                    <item.icon className={cn('h-4 w-4', item.iconColor)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label()}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                      {item.desc()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedSection>

        {/* Code Quality & Security card */}
        <AnimatedSection>
          <Card variant="subtle" className="h-full p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-base font-semibold">{m.talk_dp_next_quality_title()}</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {QUALITY_ITEMS.map((item) => (
                <li key={item.name} className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-snug">{item()}</p>
                </li>
              ))}
            </ul>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}
