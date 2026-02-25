import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Input,
  Label,
  Textarea,
} from '@repo/ui'
import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'

export type BanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  isPending: boolean
  onSubmit: (reason: string, expires?: string) => void
}

export function BanDialog({ open, onOpenChange, userName, isPending, onSubmit }: BanDialogProps) {
  const [reason, setReason] = useState('')
  const [expiry, setExpiry] = useState('')
  const isValid = reason.trim().length >= 5 && reason.trim().length <= 500

  // Reset form when dialog closes
  useEffect(() => {
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
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
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
            onClick={(e) => {
              e.preventDefault()
              onSubmit(reason.trim(), expiry ? new Date(expiry).toISOString() : undefined)
            }}
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
