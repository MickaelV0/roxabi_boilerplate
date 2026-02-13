import { PresentationNav } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AgentTeamsSection } from '@/components/presentation/AgentTeamsSection'
import { BuildingBlocksSection } from '@/components/presentation/BuildingBlocksSection'
import { DevProcessSection } from '@/components/presentation/DevProcessSection'
import { EndToEndSection } from '@/components/presentation/EndToEndSection'
import { InfraWorkflowSection } from '@/components/presentation/InfraWorkflowSection'
import { IntroSection } from '@/components/presentation/IntroSection'
import { SectionContainer } from '@/components/presentation/SectionContainer'
import { SetupSection } from '@/components/presentation/SetupSection'
import { TestReviewSection } from '@/components/presentation/TestReviewSection'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/talks/claude-code')({
  component: ClaudeCodePresentation,
})

const SECTIONS = [
  { id: 'intro', label: 'Introduction' },
  { id: 'setup', label: 'Setup' },
  { id: 'building-blocks', label: 'Building Blocks' },
  { id: 'dev-process', label: 'Dev Process' },
  { id: 'agent-teams', label: 'Agent Teams' },
  { id: 'test-review', label: 'Test & Review' },
  { id: 'infra-workflow', label: 'Infrastructure' },
  { id: 'end-to-end', label: 'End-to-End' },
] as const

export function ClaudeCodePresentation() {
  const navigate = useNavigate()

  return (
    <div className="relative bg-background text-foreground">
      {/* Roxabi wordmark */}
      <div className="fixed left-6 top-6 z-50">
        <Link
          to="/"
          className="text-sm font-bold tracking-wider text-muted-foreground/60 hover:text-foreground transition-colors uppercase"
        >
          Roxabi
        </Link>
      </div>

      {/* Theme toggle */}
      <div className="fixed right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      {/* Section navigation dots */}
      <PresentationNav sections={SECTIONS} onEscape={() => navigate({ to: '/' })} />

      {/* Scroll-snap container — disabled on mobile */}
      <div className="md:h-screen md:h-dvh md:overflow-y-auto md:snap-y md:snap-mandatory">
        <SectionContainer id="intro">
          <IntroSection />
        </SectionContainer>

        <SectionContainer id="setup">
          <SetupSection />
        </SectionContainer>

        <SectionContainer id="building-blocks">
          <BuildingBlocksSection />
        </SectionContainer>

        <SectionContainer id="dev-process">
          <DevProcessSection />
        </SectionContainer>

        <SectionContainer id="agent-teams">
          <AgentTeamsSection />
        </SectionContainer>

        <SectionContainer id="test-review">
          <TestReviewSection />
        </SectionContainer>

        <SectionContainer id="infra-workflow">
          <InfraWorkflowSection />
        </SectionContainer>

        <SectionContainer id="end-to-end">
          <EndToEndSection />
        </SectionContainer>
      </div>
    </div>
  )
}
