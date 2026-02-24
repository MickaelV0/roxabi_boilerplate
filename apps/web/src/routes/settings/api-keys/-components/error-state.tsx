import { Button } from '@repo/ui'
import { m } from '@/paraglide/messages'

function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
      <p className="text-sm text-destructive">{error}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
        {m.api_keys_retry()}
      </Button>
    </div>
  )
}

export { ErrorState }
