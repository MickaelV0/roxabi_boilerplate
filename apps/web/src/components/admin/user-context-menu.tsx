import type { AdminUser } from '@repo/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  ConfirmDialog,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DestructiveConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Textarea,
} from '@repo/ui'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  BanIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserContextMenuProps = {
  user: AdminUser
  onActionComplete: () => void
  children: React.ReactNode
}

type UserKebabButtonProps = {
  user: AdminUser
  onActionComplete: () => void
}

type UserMenuContentProps = {
  user: AdminUser
  onActionComplete: () => void
  variant: 'context' | 'dropdown'
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useUserMenuMutations(userId: string, userName: string, onActionComplete: () => void) {
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

// ---------------------------------------------------------------------------
// BanDialog
// ---------------------------------------------------------------------------

type BanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  isPending: boolean
  onSubmit: (reason: string, expires?: string) => void
}

function BanDialog({ open, onOpenChange, userName, isPending, onSubmit }: BanDialogProps) {
  const [reason, setReason] = useState('')
  const [expiry, setExpiry] = useState('')
  const isValid = reason.length >= 5 && reason.length <= 500

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setReason('')
      setExpiry('')
    }
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban {userName}</AlertDialogTitle>
          <AlertDialogDescription>
            This will revoke access for {userName}. You can unban them later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ban-reason" className="text-sm font-medium">
              Reason (5-500 characters)
            </Label>
            <Textarea
              id="ban-reason"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
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
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onSubmit(reason, expiry ? new Date(expiry).toISOString() : undefined)}
            disabled={!isValid || isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? 'Banning...' : 'Confirm Ban'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// UserMenuDialogs
// ---------------------------------------------------------------------------

type UserMenuDialogsProps = {
  user: AdminUser
  showBanDialog: boolean
  setShowBanDialog: (open: boolean) => void
  showUnbanDialog: boolean
  setShowUnbanDialog: (open: boolean) => void
  showDeleteDialog: boolean
  setShowDeleteDialog: (open: boolean) => void
  showRestoreDialog: boolean
  setShowRestoreDialog: (open: boolean) => void
  mutations: ReturnType<typeof useUserMenuMutations>
}

function UserMenuDialogs({
  user,
  showBanDialog,
  setShowBanDialog,
  showUnbanDialog,
  setShowUnbanDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  showRestoreDialog,
  setShowRestoreDialog,
  mutations: { banMutation, unbanMutation, deleteMutation, restoreMutation },
}: UserMenuDialogsProps) {
  return (
    <>
      <BanDialog
        open={showBanDialog}
        onOpenChange={setShowBanDialog}
        userName={user.name}
        isPending={banMutation.isPending}
        onSubmit={(reason, expires) =>
          banMutation.mutate({ reason, expires }, { onSuccess: () => setShowBanDialog(false) })
        }
      />
      <ConfirmDialog
        open={showUnbanDialog}
        onOpenChange={setShowUnbanDialog}
        title={`Unban ${user.name}`}
        description={`Are you sure you want to unban ${user.name}? They will regain access to their account.`}
        variant="info"
        confirmText="Unban"
        onConfirm={() =>
          unbanMutation.mutate(undefined, { onSuccess: () => setShowUnbanDialog(false) })
        }
        loading={unbanMutation.isPending}
      />
      <DestructiveConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete ${user.name}`}
        description="This action will soft-delete (archive) the user. It can be reversed by restoring."
        confirmText={user.name}
        confirmLabel={`Type "${user.name}" to confirm deletion`}
        onConfirm={() =>
          deleteMutation.mutate(undefined, { onSuccess: () => setShowDeleteDialog(false) })
        }
        isLoading={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        title={`Restore ${user.name}`}
        description={`Are you sure you want to restore ${user.name}? The user account will be reactivated.`}
        variant="info"
        confirmText="Restore"
        onConfirm={() =>
          restoreMutation.mutate(undefined, { onSuccess: () => setShowRestoreDialog(false) })
        }
        loading={restoreMutation.isPending}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// UserStatusMenuItems
// ---------------------------------------------------------------------------

type UserStatusMenuItemsProps = {
  user: AdminUser
  variant: 'context' | 'dropdown'
  onBan: () => void
  onUnban: () => void
  onDelete: () => void
  onRestore: () => void
}

function UserStatusMenuItems({
  user,
  variant,
  onBan,
  onUnban,
  onDelete,
  onRestore,
}: UserStatusMenuItemsProps) {
  const MenuItem = variant === 'context' ? ContextMenuItem : DropdownMenuItem

  return (
    <>
      {user.banned ? (
        <MenuItem
          onClick={(e) => {
            e.preventDefault()
            onUnban()
          }}
        >
          <ShieldCheckIcon className="size-4" />
          Unban
        </MenuItem>
      ) : (
        !user.deletedAt && (
          <MenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.preventDefault()
              onBan()
            }}
          >
            <BanIcon className="size-4" />
            Ban
          </MenuItem>
        )
      )}

      {user.deletedAt ? (
        <MenuItem
          onClick={(e) => {
            e.preventDefault()
            onRestore()
          }}
        >
          <RotateCcwIcon className="size-4" />
          Restore
        </MenuItem>
      ) : (
        <MenuItem
          className="text-destructive focus:text-destructive"
          onClick={(e) => {
            e.preventDefault()
            onDelete()
          }}
        >
          <Trash2Icon className="size-4" />
          Delete
        </MenuItem>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// UserMenuContent
// ---------------------------------------------------------------------------

function UserMenuContent({ user, onActionComplete, variant }: UserMenuContentProps) {
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showUnbanDialog, setShowUnbanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)

  const mutations = useUserMenuMutations(user.id, user.name, onActionComplete)

  const MenuItem = variant === 'context' ? ContextMenuItem : DropdownMenuItem
  const MenuSeparator = variant === 'context' ? ContextMenuSeparator : DropdownMenuSeparator

  return (
    <>
      <MenuItem asChild>
        <Link to="/admin/users/$userId" params={{ userId: user.id }}>
          <ExternalLinkIcon className="size-4" />
          View user
        </Link>
      </MenuItem>
      <MenuSeparator />
      <UserStatusMenuItems
        user={user}
        variant={variant}
        onBan={() => setShowBanDialog(true)}
        onUnban={() => setShowUnbanDialog(true)}
        onDelete={() => setShowDeleteDialog(true)}
        onRestore={() => setShowRestoreDialog(true)}
      />
      <UserMenuDialogs
        user={user}
        showBanDialog={showBanDialog}
        setShowBanDialog={setShowBanDialog}
        showUnbanDialog={showUnbanDialog}
        setShowUnbanDialog={setShowUnbanDialog}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        showRestoreDialog={showRestoreDialog}
        setShowRestoreDialog={setShowRestoreDialog}
        mutations={mutations}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// UserContextMenu
// ---------------------------------------------------------------------------

export function UserContextMenu({ user, onActionComplete, children }: UserContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <UserMenuContent user={user} onActionComplete={onActionComplete} variant="context" />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ---------------------------------------------------------------------------
// UserKebabButton
// ---------------------------------------------------------------------------

export function UserKebabButton({ user, onActionComplete }: UserKebabButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <UserMenuContent user={user} onActionComplete={onActionComplete} variant="dropdown" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
