import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'

export const Route = createFileRoute('/legal/cgu')({
  component: CguPage,
})

function CguPage() {
  // TODO: implement — Usage terms, intellectual property, liability, applicable law
  return (
    <LegalPageLayout title="Conditions Générales d'Utilisation">
      <p>TODO: implement CGU content</p>
    </LegalPageLayout>
  )
}
