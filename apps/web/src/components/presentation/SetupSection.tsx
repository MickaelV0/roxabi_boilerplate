import { AnimatedSection, Card, cn } from '@repo/ui'
import { Bot, Layers, Monitor, Terminal } from 'lucide-react'

const requiredTools = [
  {
    icon: Terminal,
    name: 'Bun',
    description: 'Fast JS runtime & package manager',
    color: 'text-orange-500',
  },
  {
    icon: Bot,
    name: 'Claude Code',
    description: 'npm install -g @anthropic-ai/claude-code',
    color: 'text-primary',
  },
] as const

const recommendedTools = [
  {
    icon: Layers,
    name: 'Multi-pane sessions',
    description: 'tmux or iTerm2 — agents run in parallel',
    color: 'text-green-500',
  },
  {
    icon: Monitor,
    name: 'GPU terminal',
    description: 'Ghostty, WezTerm — split panes for agents',
    color: 'text-blue-500',
  },
] as const

export function SetupSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Setup</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Two required tools. Two recommended. Five minutes.
        </p>
      </AnimatedSection>

      {/* Required tools — large cards */}
      <AnimatedSection className="mt-12">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-muted-foreground">Required</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {requiredTools.map((tool) => (
            <Card variant="subtle" key={tool.name} className="group p-6 text-center">
              <div className={cn('mx-auto mb-2', tool.color)}>
                <tool.icon className="size-6" />
              </div>
              <p className="font-semibold text-sm">{tool.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{tool.description}</p>
            </Card>
          ))}
        </div>
      </AnimatedSection>

      {/* Recommended tools — smaller cards */}
      <AnimatedSection className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-muted-foreground">Recommended</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {recommendedTools.map((tool) => (
            <Card variant="subtle" key={tool.name} className="group p-3 text-center">
              <div className={cn('mx-auto mb-2', tool.color)}>
                <tool.icon className="h-6 w-6" />
              </div>
              <p className="font-semibold text-sm">{tool.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{tool.description}</p>
            </Card>
          ))}
        </div>
      </AnimatedSection>
    </div>
  )
}
