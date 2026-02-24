import { AnimatedSection, Badge, Card, cn } from '@repo/ui'
import { Blocks, FileText, Users, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { m } from '@/paraglide/messages'

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

const blockIcons = [FileText, Zap, Users] as const

function ClaudeVisual() {
  return (
    <div className="mt-4 rounded-lg border border-border/30 bg-muted/20 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
      <p className="text-foreground/80"># Claude Configuration</p>
      <p className="mt-1">## TL;DR</p>
      <p>- Before any work: Read dev-process.mdx</p>
      <p>- All code changes require a worktree</p>
      <p>- Always use Conventional Commits</p>
    </div>
  )
}

function SkillsVisual() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {skills.slice(0, 6).map((skill) => (
        <Badge key={skill} variant="outline" className="font-mono text-xs">
          /{skill}
        </Badge>
      ))}
      <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
        {m.talk_blocks_skills_more({ count: String(skills.length - 6) })}
      </Badge>
    </div>
  )
}

function AgentsVisual() {
  return (
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
  )
}

type BlockData = {
  icon: (typeof blockIcons)[number]
  title: string
  subtitle: string
  description: string
  visual: ReactNode
}

function useBlocksData(): BlockData[] {
  return [
    {
      icon: blockIcons[0],
      title: 'CLAUDE.md',
      subtitle: m.talk_blocks_claude_subtitle(),
      description: m.talk_blocks_claude_desc(),
      visual: <ClaudeVisual />,
    },
    {
      icon: blockIcons[1],
      title: m.talk_blocks_skills_title(),
      subtitle: m.talk_blocks_skills_subtitle(),
      description: m.talk_blocks_skills_desc(),
      visual: <SkillsVisual />,
    },
    {
      icon: blockIcons[2],
      title: m.talk_blocks_agents_title(),
      subtitle: m.talk_blocks_agents_subtitle(),
      description: m.talk_blocks_agents_desc(),
      visual: <AgentsVisual />,
    },
  ]
}

type BlockCardProps = {
  block: BlockData
  index: number
}

function BlockCard({ block, index }: BlockCardProps) {
  return (
    <AnimatedSection
      className={cn(
        index === 0 && 'md:col-span-6',
        index === 1 && 'md:col-span-3',
        index === 2 && 'md:col-span-3',
        index > 0 && 'md:delay-150'
      )}
    >
      <Card
        variant="subtle"
        className={cn(
          'h-full p-6 lg:p-8',
          index === 0 && 'md:flex md:flex-row md:items-start md:gap-8'
        )}
      >
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
        <div className={cn(index === 0 && 'md:flex-1')}>{block.visual}</div>
      </Card>
    </AnimatedSection>
  )
}

export function BuildingBlocksSection() {
  const blocks = useBlocksData()

  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Blocks className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">{m.talk_blocks_title()}</h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_blocks_subtitle()}</p>
      </AnimatedSection>

      <div className="mt-12 grid gap-6 md:grid-cols-6">
        {blocks.map((block, index) => (
          <BlockCard key={block.title} block={block} index={index} />
        ))}
      </div>

      <AnimatedSection className="mt-10 text-center">
        <p className="text-muted-foreground">
          {m.talk_blocks_bottom()}{' '}
          <span className="font-semibold text-foreground">{m.talk_blocks_bottom_highlight()}</span>.
        </p>
      </AnimatedSection>
    </div>
  )
}
