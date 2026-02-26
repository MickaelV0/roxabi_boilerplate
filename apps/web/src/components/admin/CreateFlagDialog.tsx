import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from '@repo/ui'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { isErrorWithMessage } from '@/lib/errorUtils'

type CreateFlagDialogProps = {
  onCreated: () => void
}

const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function validateKey(key: string): string | null {
  if (!key) return 'Key is required'
  if (!KEY_PATTERN.test(key)) {
    return 'Key must start with a letter or number and contain only lowercase letters, numbers, hyphens, and underscores'
  }
  if (key.length > 100) return 'Key must be 100 characters or fewer'
  return null
}

async function submitFlag(payload: { key: string; name: string; description?: string }) {
  const res = await fetch('/api/admin/feature-flags', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const message = isErrorWithMessage(body) ? body.message : 'Failed to create feature flag'
    throw new Error(message)
  }
}

type FlagFormState = {
  open: boolean
  name: string
  key: string
  keyTouched: boolean
  description: string
  loading: boolean
  keyError: string | null
}

const INITIAL_STATE: FlagFormState = {
  open: false,
  name: '',
  key: '',
  keyTouched: false,
  description: '',
  loading: false,
  keyError: null,
}

function useCreateFlagForm(onCreated: () => void) {
  const [state, setState] = useState<FlagFormState>(INITIAL_STATE)

  function patch(partial: Partial<FlagFormState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }
  function handleNameChange(value: string) {
    patch({ name: value, ...(!state.keyTouched && { key: slugify(value) }) })
  }
  function handleKeyChange(value: string) {
    patch({ keyTouched: true, key: value, keyError: value ? validateKey(value) : null })
  }
  function handleOpenChange(value: boolean) {
    setState(value ? (prev) => ({ ...prev, open: true }) : () => INITIAL_STATE)
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const error = validateKey(state.key)
    if (error) {
      patch({ keyError: error })
      return
    }
    patch({ loading: true })
    try {
      await submitFlag({
        key: state.key,
        name: state.name,
        description: state.description || undefined,
      })
      toast.success('Feature flag created')
      setState(INITIAL_STATE)
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create feature flag')
    } finally {
      patch({ loading: false })
    }
  }

  return {
    ...state,
    setDescription: (v: string) => patch({ description: v }),
    handleNameChange,
    handleKeyChange,
    handleOpenChange,
    handleSubmit,
  }
}

function CreateFlagDialog({ onCreated }: CreateFlagDialogProps) {
  const form = useCreateFlagForm(onCreated)

  return (
    <Dialog open={form.open} onOpenChange={form.handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="size-4" />
          Create Flag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create feature flag</DialogTitle>
            <DialogDescription>
              Add a new feature flag to control feature availability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flag-name">Name</Label>
              <Input
                id="flag-name"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  form.handleNameChange(e.target.value)
                }
                placeholder="My Feature"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-key">Key</Label>
              <Input
                id="flag-key"
                value={form.key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  form.handleKeyChange(e.target.value)
                }
                placeholder="my-feature"
                className="font-mono"
                maxLength={100}
                required
              />
              {form.keyError && <p className="text-xs text-destructive">{form.keyError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-description">Description (optional)</Label>
              <Textarea
                id="flag-description"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  form.setDescription(e.target.value)
                }
                placeholder="What does this flag control?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={form.loading || !form.name || !form.key}>
              {form.loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateFlagDialog }
export type { CreateFlagDialogProps }
