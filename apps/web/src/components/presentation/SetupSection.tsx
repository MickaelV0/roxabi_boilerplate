import { AnimatedSection, cn } from '@repo/ui'
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

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Tool cards grid */}
        <AnimatedSection>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="group flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80"
              >
                <div className={cn('mt-0.5 shrink-0', tool.color)}>
                  <tool.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{tool.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Code block with aliases */}
        <AnimatedSection>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-sm text-muted-foreground">~/.bash_aliases</span>
          </div>
          <CodeBlock typing>{aliasCode}</CodeBlock>
        </AnimatedSection>
      </div>
    </div>
  )
}
