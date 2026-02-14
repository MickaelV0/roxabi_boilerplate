import { AnimatedSection } from '@repo/ui'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AiTeamSection } from '@/components/landing/AiTeamSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { DxSection } from '@/components/landing/DxSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HeroSection } from '@/components/landing/HeroSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { TechStackSection } from '@/components/landing/TechStackSection'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (data) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="bg-background text-foreground">
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
        <StatsSection />
      </AnimatedSection>
      <AnimatedSection>
        <CtaSection />
      </AnimatedSection>
    </div>
  )
}
