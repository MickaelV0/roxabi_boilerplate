import { Button, Input, Label, Textarea } from '@repo/ui'
import { useMutation } from '@tanstack/react-query'
import { BanIcon, RotateCcwIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type UserActionsProps = {
  userId: string
  userName: string
  isBanned: boolean
  isArchived: boolean
  onActionComplete: () => void
}

function useUserMutations(userId: string, userName: string, onActionComplete: () => void) {
  const banMutation = useMutation({
    mutationFn: async ({ reason, expires }: { reason: string; expires?: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, expires }),
      })
      if (!res.ok) throw new Error('Failed to ban user')
    },
    onSuccess: () => {
      toast.success(`${userName} has been banned`)
      onActionComplete()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to ban user')
    },
  })

  const unbanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/unban`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to unban user')
    },
    onSuccess: () => {
      toast.success(`${userName} has been unbanned`)
      onActionComplete()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to unban user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
    },
    onSuccess: () => {
      toast.success(`${userName} has been deleted`)
      onActionComplete()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore user')
    },
    onSuccess: () => {
      toast.success(`${userName} has been restored`)
      onActionComplete()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to restore user')
    },
  })

  return { banMutation, unbanMutation, deleteMutation, restoreMutation }
}

type BanFormProps = {
  isPending: boolean
  onSubmit: (reason: string, expires?: string) => void
  onCancel: () => void
}

function BanForm({ isPending, onSubmit, onCancel }: BanFormProps) {
  const [reason, setReason] = useState('')
  const [expiry, setExpiry] = useState('')
  const isValid = reason.length >= 5 && reason.length <= 500

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onSubmit(reason, expiry || undefined)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-destructive/20 bg-destructive/5 p-4 space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="ban-reason" className="text-sm font-medium">
          Ban reason (5-500 characters)
        </Label>
        <Textarea
          id="ban-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for banning this user..."
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">{reason.length}/500 characters</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ban-expiry" className="text-sm font-medium">
          Expiry date (optional)
        </Label>
        <Input
          id="ban-expiry"
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="w-48"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={!isValid}
          loading={isPending}
        >
          Confirm Ban
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

type ActionButtonsProps = {
  isBanned: boolean
  isArchived: boolean
  onBanClick: () => void
  onUnban: () => void
  onDelete: () => void
  onRestore: () => void
  unbanPending: boolean
  deletePending: boolean
  restorePending: boolean
}

function ActionButtons({
  isBanned,
  isArchived,
  onBanClick,
  onUnban,
  onDelete,
  onRestore,
  unbanPending,
  deletePending,
  restorePending,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {isBanned ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onUnban}
          loading={unbanPending}
          className="gap-1.5"
        >
          <ShieldCheckIcon className="size-3.5" />
          Unban
        </Button>
      ) : (
        !isArchived && (
          <Button variant="destructive" size="sm" onClick={onBanClick} className="gap-1.5">
            <BanIcon className="size-3.5" />
            Ban
          </Button>
        )
      )}
      {isArchived ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRestore}
          loading={restorePending}
          className="gap-1.5"
        >
          <RotateCcwIcon className="size-3.5" />
          Restore
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          loading={deletePending}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2Icon className="size-3.5" />
          Delete
        </Button>
      )}
    </div>
  )
}

/**
 * UserActions — action buttons and dialogs for user detail page.
 *
 * Renders contextual action buttons: Ban/Unban, Delete/Restore.
 * Each destructive action shows a confirmation dialog.
 */
export function UserActions({
  userId,
  userName,
  isBanned,
  isArchived,
  onActionComplete,
}: UserActionsProps) {
  const [showBanForm, setShowBanForm] = useState(false)
  const { banMutation, unbanMutation, deleteMutation, restoreMutation } = useUserMutations(
    userId,
    userName,
    onActionComplete
  )

  function handleBan(reason: string, expires?: string) {
    banMutation.mutate({ reason, expires }, { onSuccess: () => setShowBanForm(false) })
  }

  function handleUnban() {
    if (!window.confirm(`Are you sure you want to unban ${userName}?`)) return
    unbanMutation.mutate()
  }

  function handleDelete() {
    const msg = `Are you sure you want to delete ${userName}? This can be reversed by restoring.`
    if (!window.confirm(msg)) return
    deleteMutation.mutate()
  }

  function handleRestore() {
    if (!window.confirm(`Are you sure you want to restore ${userName}?`)) return
    restoreMutation.mutate()
  }

  return (
    <div className="space-y-3">
      <ActionButtons
        isBanned={isBanned}
        isArchived={isArchived}
        onBanClick={() => setShowBanForm(!showBanForm)}
        onUnban={handleUnban}
        onDelete={handleDelete}
        onRestore={handleRestore}
        unbanPending={unbanMutation.isPending}
        deletePending={deleteMutation.isPending}
        restorePending={restoreMutation.isPending}
      />
      {showBanForm && !isBanned && !isArchived && (
        <BanForm
          isPending={banMutation.isPending}
          onSubmit={handleBan}
          onCancel={() => setShowBanForm(false)}
        />
      )}
    </div>
  )
}
