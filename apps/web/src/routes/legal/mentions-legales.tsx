import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { legalConfig } from '@/config/legal.config'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/legal/mentions-legales')({
  component: MentionsLegalesPage,
})

function MentionsLegalesPage() {
  return (
    <LegalPageLayout title={m.legal_mentions_title()}>
      <h2>{m.legal_mentions_editor_title()}</h2>
      <p>
        {m.legal_mentions_editor_intro()} <strong>{legalConfig.companyName}</strong>
        {m.legal_mentions_editor_legal_form({
          legalForm: legalConfig.legalForm,
          shareCapital: legalConfig.shareCapital,
        })}
      </p>
      <p>
        <strong>{m.legal_mentions_registered_address()}</strong> {legalConfig.registeredAddress}
      </p>
      <p>
        <strong>{m.legal_mentions_rcs()}</strong> {legalConfig.rcsNumber}
      </p>
      <p>
        <strong>{m.legal_mentions_siret()}</strong> {legalConfig.siretNumber}
      </p>
      <p>
        <strong>{m.legal_mentions_vat()}</strong> {legalConfig.vatNumber}
      </p>
      <p>
        <strong>{m.legal_mentions_publication_director()}</strong> {legalConfig.publicationDirector}
      </p>

      <h2>{m.legal_mentions_host_title()}</h2>
      <p>
        <strong>{legalConfig.host.name}</strong>
      </p>
      <p>{legalConfig.host.address}</p>
      <p>{m.legal_mentions_host_phone({ phone: legalConfig.host.phone })}</p>

      <h2>{m.legal_mentions_data_protection_title()}</h2>
      <p>{m.legal_mentions_data_protection_intro()}</p>
      <p>
        {m.legal_mentions_data_protection_contact()}{' '}
        <a href={`mailto:${legalConfig.gdprContactEmail}`}>{legalConfig.gdprContactEmail}</a>
      </p>
    </LegalPageLayout>
  )
}
