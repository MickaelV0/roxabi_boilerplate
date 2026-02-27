import type { FeatureFlag } from '@repo/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  Switch,
} from '@repo/ui'
import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'

type FlagListItemProps = {
  flag: FeatureFlag
  onToggle: (id: string, enabled: boolean) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

function FlagListItem({ flag, onToggle, onDelete }: FlagListItemProps) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setToggling(true)
    try {
      await onToggle(flag.id, !flag.enabled)
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(flag.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold">{flag.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{flag.key}</p>
          {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Switch
            checked={flag.enabled}
            onCheckedChange={handleToggle}
            disabled={toggling}
            aria-label={`Toggle ${flag.name}`}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={deleting}>
                <Trash2Icon className="size-4 text-destructive" />
                <span className="sr-only">Delete {flag.name}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete feature flag</AlertDialogTitle>
                <AlertDialogDescription>
                  Deleting this flag means it will default to <strong>false</strong> for all checks.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}

export { FlagListItem }
export type { FlagListItemProps }
