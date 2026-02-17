import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { legalConfig } from '@/config/legal.config'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/legal/cgu')({
  component: CguPage,
})

function CguPage() {
  return (
    <LegalPageLayout title={m.legal_cgu_title()}>
      <h2>{m.legal_cgu_article1_title()}</h2>
      <p>{m.legal_cgu_article1_body({ companyName: legalConfig.companyName })}</p>

      <h2>{m.legal_cgu_article2_title()}</h2>
      <p>{m.legal_cgu_article2_body()}</p>

      <h2>{m.legal_cgu_article3_title()}</h2>
      <p>{m.legal_cgu_article3_body()}</p>

      <h2>{m.legal_cgu_article4_title()}</h2>
      <p>{m.legal_cgu_article4_body({ companyName: legalConfig.companyName })}</p>

      <h2>{m.legal_cgu_article5_title()}</h2>
      <p>{m.legal_cgu_article5_body1({ companyName: legalConfig.companyName })}</p>
      <p>{m.legal_cgu_article5_body2()}</p>

      <h2>{m.legal_cgu_article6_title()}</h2>
      <p>{m.legal_cgu_article6_body1({ companyName: legalConfig.companyName })}</p>
      <p>{m.legal_cgu_article6_body2()}</p>

      <h2>{m.legal_cgu_article7_title()}</h2>
      <p>
        {m.legal_cgu_article7_body()}{' '}
        <a href="/legal/confidentialite">{m.legal_cgu_article7_link()}</a>.
      </p>

      <h2>{m.legal_cgu_article8_title()}</h2>
      <p>{m.legal_cgu_article8_body()}</p>

      <h2>{m.legal_cgu_article9_title()}</h2>
      <p>{m.legal_cgu_article9_body({ companyName: legalConfig.companyName })}</p>
    </LegalPageLayout>
  )
}
