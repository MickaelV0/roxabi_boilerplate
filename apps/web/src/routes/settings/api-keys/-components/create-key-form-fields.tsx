import { Input, Label } from '@repo/ui'
import { m } from '@/paraglide/messages'
import type { useCreateKeyForm } from '../-hooks'
import { ScopeCheckboxGroup } from './scope-checkbox-group'

function CreateKeyFormFields({
  form,
  availablePermissions,
}: {
  form: ReturnType<typeof useCreateKeyForm>
  availablePermissions: string[]
}) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="api-key-name">{m.api_keys_name_label()}</Label>
        <Input
          id="api-key-name"
          value={form.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setName(e.target.value)}
          placeholder={m.api_keys_name_placeholder()}
          maxLength={100}
          required
          disabled={form.submitting}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>{m.api_keys_scopes_label()}</Label>
        <ScopeCheckboxGroup
          availablePermissions={availablePermissions}
          selectedScopes={form.selectedScopes}
          onToggle={form.handleScopeToggle}
        />
        {form.selectedScopes.size === 0 && (
          <p className="text-xs text-muted-foreground">{m.api_keys_no_scopes_warning()}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key-expiry">{m.api_keys_expiry_label()}</Label>
        <Input
          id="api-key-expiry"
          type="date"
          value={form.expiresAt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setExpiresAt(e.target.value)}
          min={today}
          disabled={form.submitting}
        />
        <p className="text-xs text-muted-foreground">{m.api_keys_expiry_hint()}</p>
      </div>
    </div>
  )
}

export { CreateKeyFormFields }
