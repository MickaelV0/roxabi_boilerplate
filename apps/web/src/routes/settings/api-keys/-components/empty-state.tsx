import { Button } from '@repo/ui'
import { KeyIcon, PlusIcon } from 'lucide-react'
import { m } from '@/paraglide/messages'

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-4 rounded-full bg-muted p-3">
        <KeyIcon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">{m.api_keys_empty_title()}</h3>
      <p className="mb-6 text-sm text-muted-foreground">{m.api_keys_empty_description()}</p>
      <Button onClick={onCreateClick}>
        <PlusIcon className="mr-2 size-4" />
        {m.api_keys_create_first()}
      </Button>
    </div>
  )
}

export { EmptyState }
