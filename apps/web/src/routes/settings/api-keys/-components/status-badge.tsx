import { Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'
import type { ApiKeyStatus } from '../-types'

function StatusBadge({ status }: { status: ApiKeyStatus }) {
  const config = {
    active: {
      label: m.api_keys_status_active(),
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    expired: {
      label: m.api_keys_status_expired(),
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    revoked: {
      label: m.api_keys_status_revoked(),
      className:
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    },
  }

  const { label, className } = config[status]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

export { StatusBadge }
