import { AnimatedSection } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { Footer } from '@/components/Footer'
import { AiTeamSection } from '@/components/landing/AiTeamSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { DxSection } from '@/components/landing/DxSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HeroSection } from '@/components/landing/HeroSection'
import { TechStackSection } from '@/components/landing/TechStackSection'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        <HeroSection />
        <AnimatedSection>
          <FeaturesSection />
        </AnimatedSection>
        <AnimatedSection>
          <AiTeamSection />
        </AnimatedSection>
        <AnimatedSection>
          <DxSection />
        </AnimatedSection>
        <AnimatedSection>
          <TechStackSection />
        </AnimatedSection>
        <AnimatedSection>
          <CtaSection />
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  )
}
