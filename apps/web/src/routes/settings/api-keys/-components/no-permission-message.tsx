import { ShieldAlertIcon } from 'lucide-react'
import { m } from '@/paraglide/messages'

function NoPermissionMessage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-4 rounded-full bg-muted p-3">
        <ShieldAlertIcon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">{m.api_keys_no_permission_title()}</h3>
      <p className="text-sm text-muted-foreground">{m.api_keys_no_permission_description()}</p>
    </div>
  )
}

export { NoPermissionMessage }
