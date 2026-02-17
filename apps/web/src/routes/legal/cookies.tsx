import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'

export const Route = createFileRoute('/legal/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  // TODO: implement — Categories, purpose of each, retention, how to manage preferences
  return (
    <LegalPageLayout title="Politique de Cookies">
      <p>TODO: implement cookie policy content</p>
    </LegalPageLayout>
  )
}
