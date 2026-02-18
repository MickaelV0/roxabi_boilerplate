import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { useConsent } from '@/lib/consent/useConsent'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/legal/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  const { openSettings } = useConsent()

  return (
    <LegalPageLayout title={m.legal_cookies_title()}>
      <h2>{m.legal_cookies_what_title()}</h2>
      <p>{m.legal_cookies_what_body()}</p>

      <h2>{m.legal_cookies_used_title()}</h2>

      <h3>{m.legal_cookies_necessary_title()}</h3>
      <p>{m.legal_cookies_necessary_body()}</p>
      <ul>
        <li>
          <strong>{m.legal_cookies_necessary_session()}</strong>{' '}
          {m.legal_cookies_necessary_session_desc()}
        </li>
        <li>
          <strong>{m.legal_cookies_necessary_security()}</strong>{' '}
          {m.legal_cookies_necessary_security_desc()}
        </li>
        <li>
          <strong>{m.legal_cookies_necessary_consent()}</strong>{' '}
          {m.legal_cookies_necessary_consent_desc()}
        </li>
      </ul>

      <h3>{m.legal_cookies_analytics_title()}</h3>
      <p>{m.legal_cookies_analytics_body()}</p>

      <h3>{m.legal_cookies_marketing_title()}</h3>
      <p>{m.legal_cookies_marketing_body()}</p>

      <h2>{m.legal_cookies_duration_title()}</h2>
      <p>
        {m.legal_cookies_duration_body({
          duration: m.legal_cookies_duration_value(),
        })}
      </p>

      <h2>{m.legal_cookies_manage_title()}</h2>
      <p>{m.legal_cookies_manage_body()}</p>
      <p>
        <button
          type="button"
          onClick={openSettings}
          className="text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer"
        >
          {m.legal_cookies_manage_button()}
        </button>
      </p>
      <p>{m.legal_cookies_manage_browser()}</p>
    </LegalPageLayout>
  )
}
