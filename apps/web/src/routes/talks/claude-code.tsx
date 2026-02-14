import { PresentationNav } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useRef } from 'react'
import { AgentTeamsSection } from '@/components/presentation/AgentTeamsSection'
import { BuildingBlocksSection } from '@/components/presentation/BuildingBlocksSection'
import { ClosingSection } from '@/components/presentation/ClosingSection'
import { DevProcessSection } from '@/components/presentation/DevProcessSection'
import { EndToEndSection } from '@/components/presentation/EndToEndSection'
import { IntroSection } from '@/components/presentation/IntroSection'
import { SectionContainer } from '@/components/presentation/SectionContainer'
import { SpecializationSection } from '@/components/presentation/SpecializationSection'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/talks/claude-code')({
  component: ClaudeCodePresentation,
})

const SECTIONS = [
  { id: 'intro', label: 'Introduction' },
  { id: 'building-blocks', label: 'Building Blocks' },
  { id: 'specialization', label: 'Specialization' },
  { id: 'dev-process', label: 'Dev Process' },
  { id: 'agent-teams', label: 'Agent Teams' },
  { id: 'end-to-end', label: 'End-to-End' },
  { id: 'closing', label: 'Closing' },
] as const

export function ClaudeCodePresentation() {
  const navigate = useNavigate()
  const handleEscape = useCallback(() => navigate({ to: '/' }), [navigate])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  return (
    <div data-presentation className="relative bg-background text-foreground">
      {/* Roxabi wordmark */}
      <div className="fixed left-6 top-6 z-50">
        <Link
          to="/"
          className="text-sm font-bold tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors uppercase"
        >
          Roxabi
        </Link>
      </div>

      {/* Theme toggle */}
      <div className="fixed right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      {/* Section navigation dots */}
      <PresentationNav
        sections={SECTIONS}
        onEscape={handleEscape}
        scrollContainerRef={scrollContainerRef}
      />

      {/* Scroll-snap container — disabled on mobile */}
      <div
        ref={scrollContainerRef}
        className="md:h-dvh md:overflow-y-auto md:snap-y md:snap-mandatory"
      >
        <SectionContainer id="intro">
          <IntroSection />
        </SectionContainer>

        <SectionContainer id="building-blocks">
          <BuildingBlocksSection />
        </SectionContainer>

        <SectionContainer id="specialization">
          <SpecializationSection />
        </SectionContainer>

        <SectionContainer id="dev-process">
          <DevProcessSection />
        </SectionContainer>

        <SectionContainer id="agent-teams">
          <AgentTeamsSection />
        </SectionContainer>

        <SectionContainer id="end-to-end">
          <EndToEndSection />
        </SectionContainer>

        <SectionContainer id="closing">
          <ClosingSection />
        </SectionContainer>
      </div>
    </div>
  )
}
