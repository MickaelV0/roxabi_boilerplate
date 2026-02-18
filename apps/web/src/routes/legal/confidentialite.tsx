import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { legalConfig } from '@/config/legal.config'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/legal/confidentialite')({
  component: ConfidentialitePage,
})

function ConfidentialitePage() {
  return (
    <LegalPageLayout title={m.legal_privacy_title()}>
      <h2>{m.legal_privacy_controller_title()}</h2>
      <p>
        {m.legal_privacy_controller_intro()} <strong>{legalConfig.companyName}</strong>
        {m.legal_privacy_controller_address()} {legalConfig.registeredAddress}.
      </p>

      <h2>{m.legal_privacy_data_collected_title()}</h2>
      <p>{m.legal_privacy_data_collected_intro()}</p>
      <ul>
        <li>{m.legal_privacy_data_name()}</li>
        <li>{m.legal_privacy_data_email()}</li>
        <li>{m.legal_privacy_data_avatar()}</li>
        <li>{m.legal_privacy_data_ip()}</li>
        <li>{m.legal_privacy_data_useragent()}</li>
      </ul>

      <h2>{m.legal_privacy_purposes_title()}</h2>
      <p>{m.legal_privacy_purposes_intro()}</p>
      <ul>
        <li>
          <strong>{m.legal_privacy_purpose_service()}</strong>{' '}
          {m.legal_privacy_purpose_service_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_purpose_security()}</strong>{' '}
          {m.legal_privacy_purpose_security_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_purpose_stats()}</strong> {m.legal_privacy_purpose_stats_desc()}
        </li>
      </ul>

      <h2>{m.legal_privacy_legal_basis_title()}</h2>
      <p>{m.legal_privacy_legal_basis_intro()}</p>
      <ul>
        <li>
          <strong>{m.legal_privacy_basis_consent()}</strong> {m.legal_privacy_basis_consent_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_basis_interest()}</strong>{' '}
          {m.legal_privacy_basis_interest_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_basis_obligation()}</strong>{' '}
          {m.legal_privacy_basis_obligation_desc()}
        </li>
      </ul>

      <h2>{m.legal_privacy_subprocessors_title()}</h2>
      <p>{m.legal_privacy_subprocessors_intro()}</p>
      <ul>
        <li>
          <strong>{m.legal_privacy_sub_neon()}</strong> — {m.legal_privacy_sub_neon_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_sub_upstash()}</strong> — {m.legal_privacy_sub_upstash_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_sub_resend()}</strong> — {m.legal_privacy_sub_resend_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_sub_vercel()}</strong> — {m.legal_privacy_sub_vercel_desc()}
        </li>
      </ul>

      <h2>{m.legal_privacy_rights_title()}</h2>
      <p>{m.legal_privacy_rights_intro()}</p>
      <ul>
        <li>
          <strong>{m.legal_privacy_right_access()}</strong> {m.legal_privacy_right_access_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_right_rectification()}</strong>{' '}
          {m.legal_privacy_right_rectification_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_right_portability()}</strong>{' '}
          {m.legal_privacy_right_portability_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_right_objection()}</strong>{' '}
          {m.legal_privacy_right_objection_desc()}
        </li>
        <li>
          <strong>{m.legal_privacy_right_deletion()}</strong>{' '}
          {m.legal_privacy_right_deletion_desc()}
        </li>
      </ul>
      <p>
        {m.legal_privacy_rights_contact()}{' '}
        <a href={`mailto:${legalConfig.gdprContactEmail}`}>{legalConfig.gdprContactEmail}</a>
      </p>

      <h2>{m.legal_privacy_authority_title()}</h2>
      <p>
        {m.legal_privacy_authority_body()}{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
      </p>
    </LegalPageLayout>
  )
}
