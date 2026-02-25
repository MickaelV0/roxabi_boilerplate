import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui'
import { toast } from 'sonner'
import type { CreateApiKeyResponse } from '@/lib/apiKeys'
import { createApiKey } from '@/lib/apiKeys'
import { m } from '@/paraglide/messages'
import { useCreateKeyForm } from '../-hooks'
import { CreateKeyFormFields } from './create-key-form-fields'

function CreateKeyDialog({
  open,
  onOpenChange,
  availablePermissions,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  availablePermissions: string[]
  onCreated: (response: CreateApiKeyResponse) => void
}) {
  const form = useCreateKeyForm(open)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    form.setSubmitting(true)
    try {
      const response = await createApiKey({
        name: form.name.trim(),
        scopes: Array.from(form.selectedScopes),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      })
      onCreated(response)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create API key'
      toast.error(message)
    } finally {
      form.setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{m.api_keys_create_title()}</DialogTitle>
            <DialogDescription>{m.api_keys_create_description()}</DialogDescription>
          </DialogHeader>

          <CreateKeyFormFields form={form} availablePermissions={availablePermissions} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={form.submitting}>
                {m.api_keys_cancel()}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.submitting || !form.name.trim()}>
              {form.submitting ? m.api_keys_creating() : m.api_keys_create()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateKeyDialog }
