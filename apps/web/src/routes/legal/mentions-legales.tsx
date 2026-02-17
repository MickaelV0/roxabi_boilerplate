import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { legalConfig } from '@/config/legal.config'

export const Route = createFileRoute('/legal/mentions-legales')({
  component: MentionsLegalesPage,
})

function MentionsLegalesPage() {
  // TODO: implement — Editor identity, RCS, VAT, host identity, GDPR rights notice (per LCEN)
  return (
    <LegalPageLayout title="Mentions Légales">
      <p>TODO: implement with fields from legalConfig ({legalConfig.companyName})</p>
    </LegalPageLayout>
  )
}
