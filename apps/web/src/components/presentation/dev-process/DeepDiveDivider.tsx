import { AnimatedSection, Badge } from '@repo/ui'
import { Bot, GitBranch, Minimize2, Package, Webhook, Wrench } from 'lucide-react'
import { m } from '@/paraglide/messages'

const topics = [
  { id: 'hooks', icon: Webhook, label: () => m.talk_dp_divider_topic_hooks() },
  { id: 'tooling', icon: Wrench, label: () => m.talk_dp_divider_topic_tooling() },
  { id: 'agents', icon: Bot, label: () => m.talk_dp_divider_topic_agents() },
  { id: 'plugins', icon: Package, label: () => m.talk_dp_divider_topic_plugins() },
  { id: 'cicd', icon: GitBranch, label: () => m.talk_dp_divider_topic_cicd() },
  { id: 'compress', icon: Minimize2, label: () => m.talk_dp_divider_topic_compress() },
] as const

export function DeepDiveDivider() {
  return (
    <div className="relative mx-auto max-w-4xl w-full text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <Badge variant="secondary" className="mb-6 text-sm">
            {m.talk_dp_divider_badge()}
          </Badge>

          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_divider_title()}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground lg:text-xl">
            {m.talk_dp_divider_subtitle()}
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-12">
          <div className="flex flex-wrap justify-center gap-3">
            {topics.map(({ id, icon: Icon, label }) => (
              <div
                key={id}
                className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label()}
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}
