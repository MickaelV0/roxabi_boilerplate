import { PresentationNav } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useRef } from 'react'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { AgentTeamsSection } from '@/components/presentation/AgentTeamsSection'
import { BuildingBlocksSection } from '@/components/presentation/BuildingBlocksSection'
import { ClosingSection } from '@/components/presentation/ClosingSection'
import { DevProcessSection } from '@/components/presentation/DevProcessSection'
import { EndToEndSection } from '@/components/presentation/EndToEndSection'
import { IntroSection } from '@/components/presentation/IntroSection'
import { SectionContainer } from '@/components/presentation/SectionContainer'
import { SpecializationSection } from '@/components/presentation/SpecializationSection'
import { ThemeToggle } from '@/components/ThemeToggle'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/talks/claude-code')({
  component: ClaudeCodePresentation,
})

export function ClaudeCodePresentation() {
  const navigate = useNavigate()
  const handleEscape = useCallback(() => navigate({ to: '/' }), [navigate])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const sections = useMemo(
    () => [
      { id: 'intro', label: m.talk_nav_intro() },
      { id: 'building-blocks', label: m.talk_nav_building_blocks() },
      { id: 'specialization', label: m.talk_nav_specialization() },
      { id: 'dev-process', label: m.talk_nav_dev_process() },
      { id: 'agent-teams', label: m.talk_nav_agent_teams() },
      { id: 'end-to-end', label: m.talk_nav_end_to_end() },
      { id: 'closing', label: m.talk_nav_closing() },
    ],
    []
  )

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

      {/* Locale switcher + Theme toggle */}
      <div className="fixed right-6 top-6 z-50 flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      {/* Section navigation dots */}
      <PresentationNav
        sections={sections}
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
