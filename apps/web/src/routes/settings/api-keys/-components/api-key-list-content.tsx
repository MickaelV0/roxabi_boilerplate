import { Button } from '@repo/ui'
import { PlusIcon } from 'lucide-react'
import type { ApiKey } from '@/lib/apiKeys'
import { m } from '@/paraglide/messages'
import { EmptyState } from './empty-state'
import { KeyListTable } from './key-list-table'

function ApiKeyListContent({
  keys,
  canWrite,
  onCreateClick,
  onRevokeClick,
}: {
  keys: ApiKey[]
  canWrite: boolean
  onCreateClick: () => void
  onRevokeClick: (key: ApiKey) => void
}) {
  if (keys.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{m.api_keys_count({ count: keys.length })}</p>
        {canWrite && (
          <Button onClick={onCreateClick}>
            <PlusIcon className="mr-2 size-4" />
            {m.api_keys_create_button()}
          </Button>
        )}
      </div>
      <KeyListTable keys={keys} onRevoke={onRevokeClick} />
    </>
  )
}

export { ApiKeyListContent }
