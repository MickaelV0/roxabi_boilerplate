import { AnimatedSection, Badge, Card, cn } from '@repo/ui'
import { FileText, Users, Zap } from 'lucide-react'

const skills = [
  'commit',
  'review',
  'bootstrap',
  'scaffold',
  'pr',
  'promote',
  'test',
  'issues',
  'issue-triage',
  'interview',
  'cleanup',
  '1b1',
  'adr',
  'agent-browser',
  'context7',
  'skill-creator',
] as const

const agentFiles = [
  'frontend-dev.md',
  'backend-dev.md',
  'devops.md',
  'tester.md',
  'fixer.md',
  'security-auditor.md',
  'architect.md',
  'product-lead.md',
  'doc-writer.md',
] as const

const agentColors: Record<string, string> = {
  'frontend-dev': 'text-chart-1 bg-chart-1/10',
  'backend-dev': 'text-chart-2 bg-chart-2/10',
  devops: 'text-chart-3 bg-chart-3/10',
  tester: 'text-chart-4 bg-chart-4/10',
  fixer: 'text-chart-5 bg-chart-5/10',
  'security-auditor': 'text-destructive bg-destructive/10',
  architect: 'text-primary bg-primary/10',
  'product-lead': 'text-accent-foreground bg-accent/20',
  'doc-writer': 'text-muted-foreground bg-muted/40',
}

// Static data — JSX in `visual` is safe at module scope since it contains no hooks or dynamic state
const blocks = [
  {
    icon: FileText,
    title: 'CLAUDE.md',
    subtitle: 'The constitution',
    description:
      'Project-level instructions. Critical rules, coding standards, skill registry, agent definitions.',
    visual: (
      <div className="mt-4 rounded-lg border border-border/30 bg-muted/20 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
        <p className="text-foreground/80"># Claude Configuration</p>
        <p className="mt-1">## TL;DR</p>
        <p>- Before any work: Read dev-process.mdx</p>
        <p>- All code changes require a worktree</p>
        <p>- Always use Conventional Commits</p>
      </div>
    ),
  },
  {
    icon: Zap,
    title: '16 Skills',
    subtitle: 'Slash commands',
    description: 'Reusable workflows: /commit, /review, /bootstrap, /scaffold, /pr, /promote...',
    visual: (
      <div className="mt-4 flex flex-wrap gap-2">
        {skills.slice(0, 6).map((skill) => (
          <Badge key={skill} variant="outline" className="font-mono text-xs">
            /{skill}
          </Badge>
        ))}
        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
          +{skills.length - 6} more
        </Badge>
      </div>
    ),
  },
  {
    icon: Users,
    title: '9 Agent Definitions',
    subtitle: '.claude/agents/',
    description: 'Role-specific .md files defining tools, permissions, domains, and skills.',
    visual: (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {agentFiles.map((file) => {
          const name = file.replace('.md', '')
          return (
            <span
              key={name}
              className={cn(
                'rounded-md px-2 py-1.5 font-mono text-xs font-medium text-center',
                agentColors[name] ?? 'text-muted-foreground bg-muted/20'
              )}
            >
              {name}
            </span>
          )
        })}
      </div>
    ),
  },
] as const

export function BuildingBlocksSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Building Blocks</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Three pillars that transform Claude from a chatbot into a development workforce.
        </p>
      </AnimatedSection>

      {/* Bento grid: featured card spans full width, remaining 2 below in equal sizes */}
      <div className="mt-12 grid gap-6 md:grid-cols-6">
        {blocks.map((block, index) => (
          <AnimatedSection
            key={block.title}
            className={cn(
              // Featured card (CLAUDE.md) spans full width
              index === 0 && 'md:col-span-6',
              // Skills card takes 3 columns
              index === 1 && 'md:col-span-3',
              // Agent definitions takes 3 columns
              index === 2 && 'md:col-span-3',
              // Stagger animation for rows below the first
              index > 0 && 'md:delay-150'
            )}
          >
            <Card
              variant="subtle"
              className={cn(
                'h-full p-6 lg:p-8',
                // Featured card gets a horizontal layout on desktop
                index === 0 && 'md:flex md:flex-row md:items-start md:gap-8'
              )}
            >
              {/* Text content */}
              <div className={cn(index === 0 && 'md:flex-1')}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <block.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{block.title}</h3>
                    <p className="text-sm text-muted-foreground">{block.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">{block.description}</p>
              </div>
              {/* Visual content — for featured card, sits beside text on desktop */}
              <div className={cn(index === 0 && 'md:flex-1')}>{block.visual}</div>
            </Card>
          </AnimatedSection>
        ))}
      </div>
    </div>
  )
}
