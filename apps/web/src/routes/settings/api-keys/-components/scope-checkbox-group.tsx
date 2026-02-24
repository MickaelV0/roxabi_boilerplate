import { Checkbox, Label } from '@repo/ui'
import { m } from '@/paraglide/messages'
import { groupPermissionsByResource } from '../-helpers'

function ScopeCheckboxGroup({
  availablePermissions,
  selectedScopes,
  onToggle,
}: {
  availablePermissions: string[]
  selectedScopes: Set<string>
  onToggle: (scope: string) => void
}) {
  const grouped = groupPermissionsByResource(availablePermissions)
  const resources = Object.keys(grouped).sort()

  return (
    <div className="max-h-60 space-y-4 overflow-y-auto rounded-md border p-3">
      {resources.map((resource) => {
        const actions = grouped[resource]
        if (!actions) return null
        return (
          <div key={resource}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {resource}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {actions.sort().map((action) => {
                const perm = `${resource}:${action}`
                const checkboxId = `scope-${perm}`
                return (
                  <div
                    key={perm}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selectedScopes.has(perm)}
                      onCheckedChange={() => onToggle(perm)}
                    />
                    <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
                      {action}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {resources.length === 0 && (
        <p className="text-sm text-muted-foreground">{m.api_keys_no_permissions()}</p>
      )}
    </div>
  )
}

export { ScopeCheckboxGroup }
