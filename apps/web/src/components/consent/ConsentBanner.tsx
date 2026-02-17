import { Button } from '@repo/ui'
import { useConsent } from '@/lib/consent/useConsent'
import { m } from '@/paraglide/messages'

export function ConsentBanner() {
  const { showBanner, acceptAll, rejectAll, openSettings } = useConsent()

  if (!showBanner) return null

  return (
    <section
      aria-label={m.consent_banner_aria_label()}
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">{m.consent_banner_text()}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={rejectAll}>
            {m.consent_reject_all()}
          </Button>
          <Button variant="outline" size="sm" onClick={openSettings}>
            {m.consent_customize()}
          </Button>
          <Button variant="outline" size="sm" onClick={acceptAll}>
            {m.consent_accept_all()}
          </Button>
        </div>
      </div>
    </section>
  )
}
