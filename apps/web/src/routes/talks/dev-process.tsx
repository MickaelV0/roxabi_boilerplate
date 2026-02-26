import { PresentationNav } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useRef } from 'react'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { BigPictureSection } from '@/components/presentation/dev-process/BigPictureSection'
import { BuildPhaseSection } from '@/components/presentation/dev-process/BuildPhaseSection'
import { ClosingSection } from '@/components/presentation/dev-process/ClosingSection'
import { CompressorSection } from '@/components/presentation/dev-process/CompressorSection'
import { FramePhaseSection } from '@/components/presentation/dev-process/FramePhaseSection'
import { HooksSection } from '@/components/presentation/dev-process/HooksSection'
import { HumanGatesSection } from '@/components/presentation/dev-process/HumanGatesSection'
import { IntroSection } from '@/components/presentation/dev-process/IntroSection'
import { ResumabilitySection } from '@/components/presentation/dev-process/ResumabilitySection'
import { ShapePhaseSection } from '@/components/presentation/dev-process/ShapePhaseSection'
import { ShipPhaseSection } from '@/components/presentation/dev-process/ShipPhaseSection'
import { TierSystemSection } from '@/components/presentation/dev-process/TierSystemSection'
import { VerifyPhaseSection } from '@/components/presentation/dev-process/VerifyPhaseSection'
import { SectionContainer } from '@/components/presentation/SectionContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/talks/dev-process')({
  component: DevProcessPresentation,
})

export function DevProcessPresentation() {
  const navigate = useNavigate()
  const handleEscape = useCallback(() => navigate({ to: '/talks' }), [navigate])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const sections = [
    { id: 'intro', label: m.talk_dp_nav_intro() },
    { id: 'big-picture', label: m.talk_dp_nav_big_picture() },
    { id: 'tier-system', label: m.talk_dp_nav_tier_system() },
    { id: 'frame-phase', label: m.talk_dp_nav_frame_phase() },
    { id: 'shape-phase', label: m.talk_dp_nav_shape_phase() },
    { id: 'build-phase', label: m.talk_dp_nav_build_phase() },
    { id: 'verify-phase', label: m.talk_dp_nav_verify_phase() },
    { id: 'ship-phase', label: m.talk_dp_nav_ship_phase() },
    { id: 'resumability', label: m.talk_dp_nav_resumability() },
    { id: 'human-gates', label: m.talk_dp_nav_human_gates() },
    { id: 'hooks', label: m.talk_dp_nav_hooks() },
    { id: 'compressor', label: m.talk_dp_nav_compressor() },
    { id: 'closing', label: m.talk_dp_nav_closing() },
  ]

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
        syncHash
      />

      {/* Scroll-snap container -- disabled on mobile */}
      <div
        ref={scrollContainerRef}
        className="md:h-dvh md:overflow-y-auto md:snap-y md:snap-mandatory"
      >
        <SectionContainer id="intro">
          <IntroSection />
        </SectionContainer>

        <SectionContainer id="big-picture">
          <BigPictureSection />
        </SectionContainer>

        <SectionContainer id="tier-system">
          <TierSystemSection />
        </SectionContainer>

        <SectionContainer id="frame-phase">
          <FramePhaseSection />
        </SectionContainer>

        <SectionContainer id="shape-phase">
          <ShapePhaseSection />
        </SectionContainer>

        <SectionContainer id="build-phase">
          <BuildPhaseSection />
        </SectionContainer>

        <SectionContainer id="verify-phase">
          <VerifyPhaseSection />
        </SectionContainer>

        <SectionContainer id="ship-phase">
          <ShipPhaseSection />
        </SectionContainer>

        <SectionContainer id="resumability">
          <ResumabilitySection />
        </SectionContainer>

        <SectionContainer id="human-gates">
          <HumanGatesSection />
        </SectionContainer>

        <SectionContainer id="hooks">
          <HooksSection />
        </SectionContainer>

        <SectionContainer id="compressor">
          <CompressorSection />
        </SectionContainer>

        <SectionContainer id="closing">
          <ClosingSection />
        </SectionContainer>
      </div>
    </div>
  )
}
