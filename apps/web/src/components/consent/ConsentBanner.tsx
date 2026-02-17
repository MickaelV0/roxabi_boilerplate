import { Button } from '@repo/ui'
import { useConsent } from '@/lib/consent'

export function ConsentBanner() {
  const { showBanner, acceptAll, rejectAll, openSettings } = useConsent()

  if (!showBanner) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez tout accepter,
          tout refuser ou personnaliser vos préférences.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={rejectAll}>
            Tout refuser
          </Button>
          <Button variant="outline" size="sm" onClick={openSettings}>
            Personnaliser
          </Button>
          <Button variant="outline" size="sm" onClick={acceptAll}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  )
}
