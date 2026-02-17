import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'

export const Route = createFileRoute('/legal/confidentialite')({
  component: ConfidentialitePage,
})

function ConfidentialitePage() {
  // TODO: implement — Data collected, processors (Neon, Upstash, Resend, Vercel), GDPR rights, CNIL contact
  return (
    <LegalPageLayout title="Politique de Confidentialité">
      <p>TODO: implement privacy policy content</p>
    </LegalPageLayout>
  )
}
