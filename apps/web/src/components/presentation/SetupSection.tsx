import { AnimatedSection, Card, cn } from '@repo/ui'
import { Bot, Layers, Monitor, Rocket, Terminal, Users } from 'lucide-react'
import { CodeBlock } from '@/components/presentation/CodeBlock'

const tools = [
  {
    icon: Layers,
    name: 'tmux',
    description: 'Multi-pane sessions — agents run in parallel',
    color: 'text-green-500',
  },
  {
    icon: Monitor,
    name: 'WezTerm',
    description: 'GPU-accelerated terminal — recommended for Agent Teams',
    color: 'text-blue-500',
  },
  {
    icon: Rocket,
    name: 'Starship',
    description: 'Fast prompt — git branch, runtimes',
    color: 'text-yellow-500',
  },
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
  {
    icon: Users,
    name: 'Agent Teams',
    description: 'One env var enables multi-agent coordination',
    color: 'text-purple-500',
  },
] as const

const aliasCode = `# Claude Code aliases
alias cc='claude'
alias ccc='claude --dangerously-skip-permissions'

# Agent-specific sessions
alias cc-front='claude --agent frontend-dev'
alias cc-back='claude --agent backend-dev'
alias cc-test='claude --agent tester'
alias cc-pa='claude --agent product-lead'`

export function SetupSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Prerequisites & Setup</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Six tools. One environment variable. You are ready.
        </p>
      </AnimatedSection>

      {/* Horizontal tool strip — inline badges flowing left to right */}
      <AnimatedSection className="mt-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tools.map((tool) => (
            <Card variant="subtle" key={tool.name} className="group p-4 text-center">
              <div className={cn('mx-auto mb-2', tool.color)}>
                <tool.icon className="size-6" />
              </div>
              <p className="font-semibold text-sm">{tool.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{tool.description}</p>
            </Card>
          ))}
        </div>
      </AnimatedSection>

      {/* Full-width code block below */}
      <AnimatedSection className="mt-8 md:delay-150">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-sm text-muted-foreground">~/.bash_aliases</span>
        </div>
        <CodeBlock typing>{aliasCode}</CodeBlock>
      </AnimatedSection>
    </div>
  )
}
