import { AnimatedSection, Card } from '@repo/ui'
import {
  FolderGit2,
  GitCompareArrows,
  Layers,
  Lightbulb,
  Monitor,
  MousePointerClick,
  Sprout,
  Terminal,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { m } from '@/paraglide/messages'
import { DashboardMockup } from './DashboardMockup'

type Tip = {
  icon: ComponentType<{ className?: string }>
  title: () => string
  description: () => string
}

export function TipsSection() {
  const tips: ReadonlyArray<Tip> = [
    { icon: Monitor, title: m.talk_tips_1_title, description: m.talk_tips_1_desc },
    { icon: Terminal, title: m.talk_tips_2_title, description: m.talk_tips_2_desc },
    { icon: FolderGit2, title: m.talk_tips_3_title, description: m.talk_tips_3_desc },
    { icon: Sprout, title: m.talk_tips_4_title, description: m.talk_tips_4_desc },
    { icon: Layers, title: m.talk_tips_5_title, description: m.talk_tips_5_desc },
    { icon: GitCompareArrows, title: m.talk_tips_6_title, description: m.talk_tips_6_desc },
    { icon: MousePointerClick, title: m.talk_tips_7_title, description: m.talk_tips_7_desc },
  ]

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] -translate-x-1/4 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">{m.talk_tips_title()}</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_tips_subtitle()}</p>
      </AnimatedSection>

      {/* 2-column layout */}
      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        {/* Left column: tips list */}
        <AnimatedSection className="lg:col-span-7">
          <Card variant="subtle" className="p-4">
            <div className="divide-y divide-border/30">
              {tips.map((tip) => (
                <div
                  key={tip.title()}
                  className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="rounded-md bg-primary/10 p-1.5 shrink-0 mt-0.5">
                    <tip.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{tip.title()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.description()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedSection>

        {/* Right column: dashboard story */}
        <AnimatedSection className="lg:col-span-5 md:delay-150">
          <Card variant="subtle" className="p-5 border-primary/30 h-full">
            <p className="text-sm font-semibold">{m.talk_tips_dashboard_title()}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.talk_tips_dashboard_subtitle()}</p>
            <p className="text-xs text-muted-foreground/80 mt-2 italic">
              {m.talk_tips_dashboard_story()}
            </p>
            <div className="mt-4">
              <DashboardMockup />
            </div>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}
